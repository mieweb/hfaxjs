import fastifyFactory from './app.js';
import { loadConfig } from './config/config.js';

async function startServer() {
  // Load configuration
  const config = loadConfig();
  
  // Create server instance
  const fastify = fastifyFactory();
  
  // Run the server
  try {
    await fastify.listen({
      port: config.port,
      host: config.host
    });
    
    fastify.log.info(`Server is running on ${config.host}:${config.port}`);
    fastify.log.info(`Swagger documentation available at http://${config.host}:${config.port}/documentation`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Start the server if this file is run directly
startServer();
