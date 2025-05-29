// This is the entry point for the standalone server
// Import the main module and start the server
import { createHylaFaxGateway } from './src/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function startServer() {
  // Create a new instance of the HylaFax Gateway
  const fastify = createHylaFaxGateway();
  
  // Configure port and host
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  
  // Start the server
  try {
    await fastify.listen({ port, host });
    console.log(`Server is running on ${host}:${port}`);
    console.log(`Swagger documentation available at http://${host}:${port}/documentation`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start the server
startServer();
