import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import schemas from './schemas.js';
import { convertToFaxableFormat } from '../utils/converter.js';
import { sendToHylafax, parseHylafaxStatus } from '../utils/hylafax.js';

// Store for callback URLs and job details
const jobStore = new Map();

/**
 * Register fax-related routes with the Fastify instance
 * @param {Object} fastify - Fastify instance
 * @param {Object} config - Application configuration
 */
export function registerFaxRoutes(fastify, config) {
  // Send Fax endpoint
  fastify.post('/fax/send', {
    schema: {
      body: schemas.sendFaxRequest,
      response: {
        200: schemas.sendFaxResponse,
        400: schemas.errorResponse,
        401: schemas.errorResponse,
        500: schemas.errorResponse
      },
      security: [{ apiKey: [] }]
    }
  }, async (request, reply) => {
    try {
      const { sender, recipient, content, options = {}, callbackUrl } = request.body;
      
      // Generate a unique job ID
      const jobId = uuidv4();
      
      // Check for mutually exclusive options
      if (options.highRes && options.lowRes) {
        reply.status(400);
        return {
          success: false,
          error: 'Invalid options',
          message: 'Cannot specify both highRes and lowRes'
        };
      }
      
      // Convert content to faxable format (PDF or TIFF)
      const faxablePath = await convertToFaxableFormat(content, jobId, config.storageDir);
      
      // Add email for notifications if provided in sender
      if (sender.email && !options.notifyAddr) {
        options.notifyAddr = sender.email;
      }
      
      // Add sender name as subject if not provided
      if (!options.subject && sender.name) {
        options.subject = `Fax from ${sender.name}`;
      }
      
      // Send to HylaFAX+
      const hylafaxJobId = await sendToHylafax({
        faxNumber: recipient.faxNumber,
        filePath: faxablePath,
        config: config.hylafax,
        options: options
      });
      
      // Store job details for status updates
      jobStore.set(hylafaxJobId, {
        jobId,
        sender,
        recipient,
        callbackUrl,
        status: 'pending',
        created: new Date().toISOString()
      });
      
      fastify.log.info(`Fax queued with ID: ${jobId} (HylaFax ID: ${hylafaxJobId})`);
      
      return {
        success: true,
        jobId,
        message: 'Fax queued successfully'
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error',
        message: error.message
      };
    }
  });
  
  // Status Update endpoint
  fastify.post('/fax/status', {
    schema: {
      body: schemas.statusUpdateRequest,
      response: {
        200: schemas.statusUpdateResponse,
        400: schemas.errorResponse,
        500: schemas.errorResponse
      }
    }
  }, async (request, reply) => {
    try {
      // Parse the status update from HylaFAX+
      const statusInfo = parseHylafaxStatus(request.body);
      const { jobId, status } = statusInfo;
      
      // Retrieve job details using HylaFax job ID
      const jobDetails = jobStore.get(jobId);
      
      if (!jobDetails) {
        reply.status(404);
        return {
          success: false,
          error: 'Not found',
          message: `No job found with ID: ${jobId}`
        };
      }
      
      // Update job status
      jobDetails.status = status;
      jobStore.set(jobId, { ...jobDetails, ...statusInfo });
      
      // Notify the original sender via callback URL if provided
      if (jobDetails.callbackUrl) {
        try {
          await fetch(jobDetails.callbackUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              jobId: jobDetails.jobId,
              ...statusInfo
            })
          });
          
          fastify.log.info(`Callback sent for job ${jobDetails.jobId} to ${jobDetails.callbackUrl}`);
        } catch (callbackError) {
          fastify.log.error(`Failed to send callback for job ${jobDetails.jobId}: ${callbackError.message}`);
        }
      }
      
      // Clean up job store for completed jobs
      if (['success', 'failed'].includes(status)) {
        // Keep the job in store for a while for status inquiries
        setTimeout(() => {
          jobStore.delete(jobId);
          fastify.log.debug(`Job ${jobId} removed from store`);
        }, 86400000); // 24 hours
      }
      
      return {
        success: true,
        message: `Status updated: ${status}`
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error',
        message: error.message
      };
    }
  });
  
  // Get HylaFAX+ Queue Status
  fastify.get('/fax/queue', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            jobs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  jobId: { type: 'string' },
                  priority: { type: 'string' },
                  status: { type: 'string' },
                  owner: { type: 'string' },
                  number: { type: 'string' },
                  pages: { type: 'integer' },
                  dials: { type: 'integer' },
                  timeToSend: { type: 'string' },
                  statusMessage: { type: 'string' }
                }
              }
            }
          }
        },
        401: schemas.errorResponse,
        500: schemas.errorResponse
      },
      security: [{ apiKey: [] }]
    }
  }, async (request, reply) => {
    try {
      const jobs = await getJobQueue(config.hylafax);
      return { jobs };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error',
        message: error.message
      };
    }
  });

  // Get Fax Status endpoint
  fastify.get('/fax/status/:jobId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          jobId: { type: 'string' }
        },
        required: ['jobId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            jobId: { type: 'string' },
            status: { type: 'string' },
            recipient: { type: 'object' },
            created: { type: 'string' },
            updated: { type: 'string' }
          }
        },
        404: schemas.errorResponse,
        500: schemas.errorResponse
      },
      security: [{ apiKey: [] }]
    }
  }, async (request, reply) => {
    const { jobId } = request.params;
    
    // Find job by client job ID
    const jobEntry = Array.from(jobStore.entries())
      .find(([_, job]) => job.jobId === jobId);
    
    if (!jobEntry) {
      reply.status(404);
      return {
        success: false,
        error: 'Not found',
        message: `No job found with ID: ${jobId}`
      };
    }
    
    const [_, jobDetails] = jobEntry;
    
    return {
      jobId,
      status: jobDetails.status,
      recipient: jobDetails.recipient,
      created: jobDetails.created,
      updated: jobDetails.updated || jobDetails.created
    };
  });
}
