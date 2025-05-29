# Getting Started with Fastify-HylaFax Gateway

This guide will help you set up and start using the Fastify-HylaFax Gateway in your project.

## Installation

### As a Standalone Server

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fastify-hylafax-gateway.git
cd fastify-hylafax-gateway
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp src/.env.example .env
```

4. Edit the `.env` file with your HylaFax server details:
```
API_KEYS=your-api-key-1,your-api-key-2
HYLAFAX_HOST=your-hylafax-server
HYLAFAX_USER=your-username
HYLAFAX_PASSWORD=your-password
```

5. Start the server:
```bash
npm start
```

The server will be available at http://localhost:3000, with API documentation at http://localhost:3000/documentation.

### Using Docker

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fastify-hylafax-gateway.git
cd fastify-hylafax-gateway
```

2. Create a `.env` file for Docker Compose:
```bash
cp src/.env.example .env
```

3. Edit the `.env` file with your HylaFax server details.

4. Start the container:
```bash
docker-compose up -d
```

### As a Module in Your Project

1. Install the package:
```bash
npm install fastify-hylafax-gateway
```

2. Import and use in your code:
```javascript
import { createHylaFaxGateway } from 'fastify-hylafax-gateway';

// Create a gateway instance with custom configuration
const gateway = createHylaFaxGateway({
  apiKeys: ['your-api-key'],
  hylafax: {
    host: 'your-hylafax-server',
    user: 'your-username',
    password: 'your-password'
  }
});

// Start the server
gateway.listen({ port: 3000 }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Server is running on port 3000');
});
```

## Using the API

### Sending a Fax

To send a fax, make a POST request to the `/fax/send` endpoint:

```javascript
import fetch from 'node-fetch';

const response = await fetch('http://localhost:3000/fax/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key'
  },
  body: JSON.stringify({
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
      type: 'text',
      data: 'This is a test fax message.'
    },
    callbackUrl: 'https://your-app.com/fax-status-callback'
  })
});

const result = await response.json();
console.log(result);
// { success: true, jobId: '12345', message: 'Fax queued successfully' }
```

### Checking Fax Status

To check the status of a fax, make a GET request to the `/fax/status/:jobId` endpoint:

```javascript
const response = await fetch(`http://localhost:3000/fax/status/${jobId}`, {
  method: 'GET',
  headers: {
    'x-api-key': 'your-api-key'
  }
});

const result = await response.json();
console.log(result);
// { jobId: '12345', status: 'pending', recipient: { ... }, created: '...', updated: '...' }
```

### Receiving Status Callbacks

When a fax status changes, the gateway will send a POST request to the `callbackUrl` you provided when sending the fax:

```javascript
// Example Express route to handle callbacks
app.post('/fax-status-callback', (req, res) => {
  const statusUpdate = req.body;
  console.log('Fax status update:', statusUpdate);
  // { jobId: '12345', status: 'success', pages: 2, timestamp: '...', message: '...' }
  
  // Handle the status update in your application
  if (statusUpdate.status === 'success') {
    // Fax was sent successfully
  } else if (statusUpdate.status === 'failed') {
    // Fax failed to send
  }
  
  res.status(200).json({ received: true });
});
```

## Advanced Configuration

You can customize the behavior of the gateway by providing configuration options:

```javascript
const gateway = createHylaFaxGateway({
  // Fastify instance options
  fastify: {
    logger: {
      level: 'debug'
    }
  },
  
  // HylaFax connection options
  hylafax: {
    host: 'fax.example.com',
    port: 4559,
    user: 'faxuser',
    password: 'faxpass'
  },
  
  // API authentication
  apiKeys: ['api-key-1', 'api-key-2'],
  
  // Retry configuration
  maxRetries: 12,
  
  // Logging
  logLevel: 'info',
  
  // File upload limits
  maxFileSize: 10485760, // 10MB
  
  // CORS configuration
  cors: {
    origin: '*'
  },
  
  // Storage for temporary files
  storageDir: '/tmp/faxjsgw'
});
```

## Troubleshooting

### Common Issues

1. **Connection to HylaFax fails**
   - Ensure your HylaFax server is running and accessible
   - Check that the host, port, username, and password are correct
   - Make sure the network allows connections to the HylaFax port (usually 4559)

2. **Fax sending fails**
   - Check that the fax number is in the correct format
   - Ensure the HylaFax server has the necessary permissions and configuration to send faxes
   - Look at the server logs for specific error messages

3. **API key authentication errors**
   - Verify that you're sending the API key in the `x-api-key` header
   - Check that the API key matches one of the configured keys

### Logs

To get more detailed logs, set the `LOG_LEVEL` environment variable to `debug` or provide `logLevel: 'debug'` in the configuration options.

## Examples

Check out the `/examples` directory in the repository for complete examples of different usage scenarios.
