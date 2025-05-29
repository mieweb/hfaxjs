// Example of sending a fax using the Fastify-HylaFax Gateway API

import fetch from 'node-fetch';

async function sendFax() {
  const apiKey = 'your-api-key';
  const apiUrl = 'http://localhost:3000/fax/send';
  
  // Sample fax content
  const faxData = {
    sender: {
      name: 'John Doe',
      email: 'john@example.com',
      id: 'client-123'
    },
    recipient: {
      name: 'Jane Smith',
      faxNumber: '+15551234567'
    },
    content: {
      type: 'markdown',
      data: `# Fax Title

Dear Jane Smith,

This is a sample fax sent via the Fastify-HylaFAX+ Gateway.

## Important Information

- Item 1
- Item 2
- Item 3

Best regards,
John Doe
      `
    },
    // HylaFAX+ specific options
    options: {
      highRes: true,             // Use high resolution 
      priority: 200,             // Higher priority (0-255)
      subject: 'Important Fax',  // Subject line
      comments: 'Please review immediately', // Comments
      notifyType: 'done',        // Send email notification when done
      coverpage: false           // No cover page
    },
    callbackUrl: 'https://example.com/fax/status-callback'
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(faxData)
    });
    
    const result = await response.json();
    console.log('Fax send result:', result);
    
    // If successful, you can store the jobId for later status queries
    if (result.success) {
      const jobId = result.jobId;
      console.log(`Fax queued successfully with job ID: ${jobId}`);
      
      // You can also check the status later
      await checkFaxStatus(jobId, apiKey);
    }
  } catch (error) {
    console.error('Error sending fax:', error);
  }
}

async function checkFaxStatus(jobId, apiKey) {
  const statusUrl = `http://localhost:3000/fax/status/${jobId}`;
  
  try {
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      }
    });
    
    const result = await response.json();
    console.log(`Status for job ${jobId}:`, result);
  } catch (error) {
    console.error('Error checking fax status:', error);
  }
}

// Execute the example
sendFax();
