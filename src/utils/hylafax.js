import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs';

const execPromise = promisify(exec);
const readFile = promisify(fs.readFile);

/**
 * Send a document to the HylaFAX+ server
 * @param {Object} params - Parameters for sending fax
 * @param {string} params.faxNumber - Recipient fax number
 * @param {string} params.filePath - Path to the document file
 * @param {Object} params.config - HylaFAX+ configuration
 * @returns {Promise<string>} - HylaFAX+ job ID
 */
export async function sendToHylafax({ faxNumber, filePath, config, options = {} }) {
  // Format phone number (remove non-digit characters)
  const formattedNumber = faxNumber.replace(/[^0-9+]/g, '');
  
  // Build the sendfax command for HylaFAX+
  const command = [
    'sendfax',
    `-h ${config.host}`,
    // Resolution options
    options.highRes ? '-l' : '-m', // -l for high resolution, -m for medium resolution
    !options.highRes && !options.lowRes ? '-r' : '', // Normal resolution if not specified
    options.lowRes ? '-n' : '', // -n for low resolution
    // Authentication and connection
    `-S ${config.user ? config.user + '@' : ''}${config.host}`,
    config.password ? `-P ${config.password}` : '',
    config.useSSL ? `-s` : '', // Use SSL if configured
    // Advanced options
    options.priority ? `-p ${options.priority}` : '', // Priority: 0-255, higher is higher priority
    options.killtime ? `-k ${options.killtime}` : '', // Time to kill job if not sent
    options.notifyType ? `-x ${options.notifyType}` : '', // Email notification type
    options.notifyAddr ? `-f ${options.notifyAddr}` : '', // Email address for notifications
    `-D`,  // HylaFAX+ specific option for notification
    // Destination
    `-d "${formattedNumber}"`,
    options.subject ? `-s "${options.subject}"` : '', // Subject/title for the fax
    options.comments ? `-c "${options.comments}"` : '', // Comments
    // The file to send
    filePath
  ].filter(Boolean).join(' ');
  
  try {
    // Execute the sendfax command
    const { stdout, stderr } = await execPromise(command);
    
    // Check for HylaFAX+ specific errors in stderr
    if (stderr && (
      stderr.includes('Login failed') || 
      stderr.includes('Connection refused') ||
      stderr.includes('Authentication failed')
    )) {
      throw new Error(`HylaFAX+ authentication error: ${stderr.trim()}`);
    }
    
    // Extract the job ID from the output
    const jobIdMatch = stdout.match(/request id is (\d+)/i);
    if (!jobIdMatch) {
      // HylaFAX+ may have different output formats
      const altJobIdMatch = stdout.match(/job (\d+) queued/i) || 
                           stdout.match(/fax job (\d+)/i);
      
      if (altJobIdMatch) {
        return altJobIdMatch[1];
      }
      
      throw new Error(`Failed to extract job ID from output: ${stdout}`);
    }
    
    return jobIdMatch[1];
  } catch (error) {
    if (error.message.includes('command not found')) {
      throw new Error('HylaFAX+ client tools not installed. Please install HylaFAX+ client package.');
    }
    throw new Error(`Failed to send fax: ${error.message}`);
  }
}

/**
 * Parse the status update from HylaFAX+
 * @param {Object} statusInfo - Status information from HylaFAX+
 * @returns {Object} - Parsed status information
 */
export function parseHylafaxStatus(statusInfo) {
  // Map HylaFAX+ status codes to our status values
  // HylaFAX+ has more detailed status codes than standard HylaFAX
  const statusMap = {
    // Standard statuses
    'done': 'success',
    'failed': 'failed',
    'busy': 'busy',
    'no_answer': 'no_answer',
    'rejected': 'rejected',
    'sending': 'sending',
    'waiting': 'pending',
    // HylaFAX+ specific statuses
    'suspended': 'suspended',
    'blocked': 'blocked',
    'requeued': 'requeued',
    'removed': 'removed',
    'timedout': 'failed',
    'format_error': 'failed',
    'killed': 'failed',
    'batching': 'pending',
    'done+archived': 'success'
  };
  
  // Create the parsed status object with extended fields for HylaFAX+
  const parsedStatus = {
    jobId: statusInfo.jobId,
    status: statusMap[statusInfo.status] || 'unknown',
    timestamp: statusInfo.timestamp || new Date().toISOString(),
    pages: statusInfo.pages || 0,
    message: statusInfo.message || '',
    attempts: statusInfo.attempts || 1,
    dialogs: statusInfo.dialogs || [],
    queuePosition: statusInfo.queuePosition || null
  };
  
  return parsedStatus;
}

/**
 * Query the HylaFAX+ server for job status
 * @param {string} jobId - HylaFAX+ job ID
 * @param {Object} config - HylaFAX+ configuration
 * @returns {Promise<Object>} - Job status information
 */
/**
 * Get the list of jobs in the HylaFAX+ queue
 * @param {Object} config - HylaFAX+ configuration
 * @returns {Promise<Array>} - List of jobs in the queue
 */
export async function getJobQueue(config) {
  const authParams = config.user ? `-u ${config.user}` : '';
  const sslParam = config.useSSL ? '-s' : '';
  const passwordParam = config.password ? `-p ${config.password}` : '';
  const command = `faxstat -h ${config.host} ${authParams} ${passwordParam} ${sslParam} -s`;
  
  try {
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr && stderr.includes('Authentication failed')) {
      throw new Error(`HylaFAX+ authentication error: ${stderr.trim()}`);
    }
    
    // Parse the output to extract jobs
    const jobs = [];
    const lines = stdout.trim().split('\n');
    
    // Skip header line if present
    const startIndex = lines[0].includes('JID') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse job information - HylaFAX+ format is typically:
      // JID  Pri S  Owner      Number       Pages Dials     TTS Status
      const parts = line.split(/\s+/);
      if (parts.length >= 7) {
        jobs.push({
          jobId: parts[0],
          priority: parts[1],
          status: parts[2],
          owner: parts[3],
          number: parts[4],
          pages: parseInt(parts[5], 10) || 0,
          dials: parseInt(parts[6], 10) || 0,
          timeToSend: parts[7] || '',
          statusMessage: parts.slice(8).join(' ')
        });
      }
    }
    
    return jobs;
  } catch (error) {
    throw new Error(`Failed to get job queue: ${error.message}`);
  }
}

export async function queryJobStatus(jobId, config) {
  // HylaFAX+ specific command structure
  const authParams = config.user ? `-u ${config.user}` : '';
  const sslParam = config.useSSL ? '-s' : '';
  const passwordParam = config.password ? `-p ${config.password}` : '';
  const command = `faxstat -h ${config.host} ${authParams} ${passwordParam} ${sslParam} -s | grep "${jobId}"`;
  try {
    const { stdout, stderr } = await execPromise(command);
    
    // Check for authentication errors
    if (stderr && (stderr.includes('Login failed') || stderr.includes('Authentication failed'))) {
      throw new Error(`HylaFAX+ authentication error: ${stderr.trim()}`);
    }
    
    // Parse the output to determine job status
    let status = 'unknown';
    let message = '';
    let pages = 0;
    
    if (stdout.includes('done')) {
      status = 'success';
      message = 'Fax sent successfully';
    } else if (stdout.includes('failed')) {
      status = 'failed';
      message = 'Fax transmission failed';
    } else if (stdout.includes('busy')) {
      status = 'busy';
      message = 'Recipient fax number is busy';
    } else if (stdout.includes('no answer')) {
      status = 'no_answer';
      message = 'No answer from recipient';
    } else if (stdout.includes('rejected')) {
      status = 'rejected';
      message = 'Fax rejected by recipient';
    } else if (stdout.includes('sending')) {
      status = 'sending';
      message = 'Fax is being transmitted';
    } else if (stdout.includes('waiting')) {
      status = 'pending';
      message = 'Fax is queued for sending';
    }
    
    return {
      jobId,
      status,
      message,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to query job status: ${error.message}`);
  }
}
