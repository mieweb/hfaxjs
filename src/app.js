import Fastify from 'fastify';
import fastifyAuth from '@fastify/auth';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import dotenv from 'dotenv';
import { loadConfig } from './config/config.js';
import { configureLogger } from './utils/logger.js';
import { registerAuthPlugin } from './middleware/auth.js';
import { registerFaxRoutes } from './routes/fax.js';

// Load environment variables from .env file
dotenv.config();

/**
 * Create and configure a Fastify server with HylaFax Gateway functionality
 * @param {Object} options - Configuration options
 * @returns {Object} - Configured Fastify instance
 */
export default function fastifyFactory(options = {}) {
  // Get configuration
  const config = loadConfig(options);
  
  // Configure Fastify
  const fastify = Fastify({
    logger: configureLogger(config.logLevel),
    ...config.fastify
  });
  
  // Register plugins
  fastify.register(fastifyCors, {
    origin: config.cors.origin || true
  });
  
  fastify.register(fastifyMultipart, {
    limits: {
      fileSize: config.maxFileSize || 10 * 1024 * 1024 // 10MB default
    }
  });
  
  fastify.register(fastifyAuth);
  
  // Register Swagger documentation
  if (config.enableSwagger !== false) {
    fastify.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'Fastify-HylaFax Gateway API',
          description: 'API for sending faxes via HylaFax',
          version: '1.0.0'
        },
        servers: [
          {
            url: `http://${config.host}:${config.port}`,
            description: 'Development server'
          }
        ],
        components: {
          securitySchemes: {
            apiKey: {
              type: 'apiKey',
              name: 'x-api-key',
              in: 'header'
            }
          }
        }
      }
    });
    
    fastify.register(fastifySwaggerUI, {
      routePrefix: '/documentation'
    });
  }
  
  // Register API key authentication
  registerAuthPlugin(fastify, config);
  
  // Register routes
  registerFaxRoutes(fastify, config);
  
  // Add health check route
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });
  
  // Allow decorated instance to be used in other applications
  return fastify;
}
