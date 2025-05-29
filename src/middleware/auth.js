/**
 * Register the authentication plugin with Fastify
 * @param {Object} fastify - Fastify instance
 * @param {Object} config - Application configuration
 */
export function registerAuthPlugin(fastify, config) {
  // Verify API key middleware
  const verifyApiKey = (request, reply, done) => {
    const apiKey = request.headers['x-api-key'];
    
    if (!apiKey) {
      return done(new Error('API key is required'));
    }
    
    if (!config.apiKeys || !config.apiKeys.includes(apiKey)) {
      return done(new Error('Invalid API key'));
    }
    
    done();
  };
  
  // Register the authentication function with Fastify
  fastify.decorate('verifyApiKey', verifyApiKey);
  
  // Add preHandler hook for API key authentication
  fastify.addHook('preHandler', (request, reply, done) => {
    // Skip authentication for health check and documentation routes
    if (
      request.routerPath === '/health' || 
      request.routerPath === '/documentation' ||
      request.routerPath === '/documentation/*'
    ) {
      return done();
    }
    
    fastify.verifyApiKey(request, reply, done);
  });
}
