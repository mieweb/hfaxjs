import { test } from 'node:test';
import assert from 'node:assert';
import { createHylaFaxGateway } from '../src/index.js';

// Mock HylaFAX+ utility functions
jest.mock('../src/utils/hylafax.js', () => ({
  sendToHylafax: jest.fn().mockResolvedValue('12345'),
  parseHylafaxStatus: jest.fn().mockReturnValue({
    jobId: '12345',
    status: 'success',
    timestamp: new Date().toISOString(),
    pages: 2,
    message: 'Fax sent successfully'
  }),
  queryJobStatus: jest.fn().mockResolvedValue({
    jobId: '12345',
    status: 'success',
    message: 'Fax sent successfully',
    timestamp: new Date().toISOString()
  })
}));

// Mock converter utility function
jest.mock('../src/utils/converter.js', () => ({
  convertToFaxableFormat: jest.fn().mockResolvedValue('/tmp/fax-12345.pdf')
}));

test('Sending a fax', async (t) => {
  // Create a gateway instance with test configuration
  const gateway = createHylaFaxGateway({
    apiKeys: ['test-api-key']
  });
  
  // Mock request data
  const faxRequest = {
    sender: {
      name: 'Test Sender',
      email: 'test@example.com',
      id: 'test-123'
    },
    recipient: {
      name: 'Test Recipient',
      faxNumber: '+15551234567'
    },
    content: {
      type: 'text',
      data: 'This is a test fax'
    },
    callbackUrl: 'https://example.com/callback'
  };
  
  // Send a request to the /fax/send endpoint
  const response = await gateway.inject({
    method: 'POST',
    url: '/fax/send',
    headers: {
      'x-api-key': 'test-api-key'
    },
    payload: faxRequest
  });
  
  // Parse the response
  const result = JSON.parse(response.payload);
  
  // Verify the response
  assert.equal(response.statusCode, 200);
  assert.equal(result.success, true);
  assert.ok(result.jobId);
  assert.equal(result.message, 'Fax queued successfully');
});

test('Receiving status update', async (t) => {
  // Create a gateway instance with test configuration
  const gateway = createHylaFaxGateway({
    apiKeys: ['test-api-key']
  });
  
  // First send a fax to create a job in the store
  const sendResponse = await gateway.inject({
    method: 'POST',
    url: '/fax/send',
    headers: {
      'x-api-key': 'test-api-key'
    },
    payload: {
      sender: { name: 'Test Sender' },
      recipient: { faxNumber: '+15551234567' },
      content: { type: 'text', data: 'Test fax' },
      callbackUrl: 'https://example.com/callback'
    }
  });
  
  const sendResult = JSON.parse(sendResponse.payload);
  const jobId = sendResult.jobId;
  
  // Mock status update from HylaFax
  const statusUpdate = {
    jobId: '12345',
    status: 'success',
    pages: 2,
    timestamp: new Date().toISOString(),
    message: 'Fax sent successfully'
  };
  
  // Send status update
  const statusResponse = await gateway.inject({
    method: 'POST',
    url: '/fax/status',
    payload: statusUpdate
  });
  
  // Parse the response
  const statusResult = JSON.parse(statusResponse.payload);
  
  // Verify response
  assert.equal(statusResponse.statusCode, 200);
  assert.equal(statusResult.success, true);
  assert.equal(statusResult.message, 'Status updated: success');
  
  // Check if we can get the updated status
  const getStatusResponse = await gateway.inject({
    method: 'GET',
    url: `/fax/status/${jobId}`,
    headers: {
      'x-api-key': 'test-api-key'
    }
  });
  
  const getStatusResult = JSON.parse(getStatusResponse.payload);
  
  // Verify status is retrieved correctly
  assert.equal(getStatusResponse.statusCode, 200);
  assert.equal(getStatusResult.jobId, jobId);
  assert.equal(getStatusResult.status, 'success');
});

test('Missing API key', async (t) => {
  // Create a gateway instance with test configuration
  const gateway = createHylaFaxGateway({
    apiKeys: ['test-api-key']
  });
  
  // Send request without API key
  const response = await gateway.inject({
    method: 'POST',
    url: '/fax/send',
    payload: {
      sender: { name: 'Test Sender' },
      recipient: { faxNumber: '+15551234567' },
      content: { type: 'text', data: 'Test fax' }
    }
  });
  
  // Verify request is rejected
  assert.equal(response.statusCode, 401);
});
