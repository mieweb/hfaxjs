/**
 * JSON schemas for request and response validation
 */
export default {
  // Fax send request schema
  sendFaxRequest: {
    type: 'object',
    required: ['sender', 'recipient', 'content'],
    properties: {
      sender: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          id: { type: 'string' }
        }
      },
      recipient: {
        type: 'object',
        required: ['faxNumber'],
        properties: {
          name: { type: 'string' },
          faxNumber: { 
            type: 'string',
            pattern: '^\\+?[0-9\\-\\s()]{7,20}$'
          }
        }
      },
      content: {
        type: 'object',
        required: ['type', 'data'],
        properties: {
          type: { 
            type: 'string',
            enum: ['text', 'markdown', 'html']
          },
          data: { type: 'string' }
        }
      },
      options: {
        type: 'object',
        properties: {
          highRes: { type: 'boolean' },
          lowRes: { type: 'boolean' },
          priority: { type: 'integer', minimum: 0, maximum: 255 },
          killtime: { type: 'string' },
          notifyType: { 
            type: 'string', 
            enum: ['none', 'done', 'requeue', 'done+requeue']
          },
          notifyAddr: { type: 'string', format: 'email' },
          subject: { type: 'string' },
          comments: { type: 'string' },
          coverpage: { type: 'boolean' }
        }
      },
      callbackUrl: { 
        type: 'string',
        format: 'uri'
      }
    }
  },
  
  // Fax send response schema
  sendFaxResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      jobId: { type: 'string' },
      message: { type: 'string' }
    }
  },
  
  // Status update request schema
  statusUpdateRequest: {
    type: 'object',
    properties: {
      jobId: { type: 'string' },
      status: { 
        type: 'string',
        enum: ['pending', 'sending', 'success', 'busy', 'failed', 'no_answer', 'rejected']
      },
      pages: { type: 'number' },
      timestamp: { type: 'string', format: 'date-time' },
      message: { type: 'string' }
    },
    required: ['jobId', 'status']
  },
  
  // Status update response schema
  statusUpdateResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' }
    }
  },
  
  // Error response schema
  errorResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      error: { type: 'string' },
      message: { type: 'string' }
    }
  }
};
