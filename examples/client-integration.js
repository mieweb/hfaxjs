// Example of using Fastify-HylaFax Gateway as a module in your own application

// Import the HylaFax Gateway creator
import { createHylaFaxGateway } from 'fastify-hylafax-gateway';
import Fastify from 'fastify';

// Create your main application Fastify instance
const app = Fastify({
  logger: true
});

// Register routes for your application
app.get('/', async (request, reply) => {
  return { message: 'Welcome to my application' };
});

// Create the HylaFax Gateway with custom configuration
const hylafaxGateway = createHylaFaxGateway({
  apiKeys: ['custom-api-key-123'],
  hylafax: {
    host: 'fax.example.com',
    port: 4559,
    user: 'faxuser',
    password: 'faxpass'
  }
});

// Register the HylaFax Gateway as a plugin with your application
// All routes will be prefixed with /fax-service
app.register(async (instance, options) => {
  // Loop through all routes in the gateway and register them on your app
  for (const route of hylafaxGateway.routes) {
    // Add the route to your app with a prefix
    instance.route({
      ...route,
      url: `/fax-service${route.url}`
    });
  }
});

// Start your application
const start = async () => {
  try {
    await app.listen({ port: 3000 });
    console.log('Server is running on port 3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
