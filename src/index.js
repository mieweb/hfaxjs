import fastifyFactory from './app.js';

/**
 * Create a new instance of the Fastify-HylaFAX+ Gateway
 * @param {Object} options - Configuration options
 * @param {Object} [options.fastify] - Fastify instance options
 * @param {Object} [options.hylafax] - HylaFAX+ connection options
 * @param {string} [options.hylafax.host] - HylaFAX+ server hostname
 * @param {number} [options.hylafax.port] - HylaFAX+ server port
 * @param {string} [options.hylafax.user] - HylaFAX+ username
 * @param {string} [options.hylafax.password] - HylaFAX+ password
 * @param {boolean} [options.hylafax.useSSL] - Whether to use SSL for HylaFAX+ connection
 * @param {number} [options.maxRetries] - Maximum retry attempts for faxes
 * @param {Array<string>} [options.apiKeys] - List of valid API keys
 * @returns {Object} - Fastify instance with HylaFAX+ Gateway routes
 */
export function createHylaFaxGateway(options = {}) {
  return fastifyFactory(options);
}

// Export route schemas for consumers to use in their own routes
export { default as faxSchemas } from './routes/schemas.js';

// Export all the utility functions
export * from './utils/converter.js';
export * from './utils/hylafax.js';

// Default export for CommonJS compatibility
export default { createHylaFaxGateway };
