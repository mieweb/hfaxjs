# Fastify-HylaFAX+ Gateway

A modern Node.js bridge between web applications and HylaFAX+ servers, allowing for seamless fax transmission from web-based applications.

## Overview

This server acts as a middleware between client applications and a HylaFAX+ fax server. It enables:

- Converting various document formats (text, Markdown, HTML) into faxable formats (PDF, TIFF)
- Submitting faxes to a HylaFAX+ server
- Handling callback notifications for fax status updates
- Forwarding status updates to client applications

## Features

- **Authentication System**: API key-based authentication to secure fax submission
- **Fax Submission**: Simple REST API endpoint to submit fax content
- **Document Conversion**: Convert text, Markdown, and HTML content into faxable formats
- **Status Tracking**: Monitor fax delivery status and receive notifications
- **Callback System**: Forward status updates to client applications
- **Retry Handling**: Support for configurable retry attempts for failed transmissions
- **Logging & Auditing**: Comprehensive logging of all fax operations

## API Endpoints

### Send Fax
```
POST /fax/send
```

**Request Body:**
```json
{
  "sender": {
    "name": "John Doe",
    "email": "john@example.com",
    "id": "client-123"
  },
  "recipient": {
    "name": "Jane Smith",
    "faxNumber": "+1234567890"
  },
  "content": {
    "type": "text|markdown|html",
    "data": "Content to be faxed..."
  },
  "callbackUrl": "https://example.com/fax/status"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "hylafax-job-456",
  "message": "Fax queued successfully"
}
```

### Status Update
```
POST /fax/status
```

This endpoint receives updates from the HylaFax server about fax job statuses and forwards them to the client's callback URL.

## Installation

### Prerequisites
- Node.js 18.x or higher
- HylaFAX+ server setup and configured
- Dependencies for document conversion (see package.json)

### Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd faxjsgw
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your specific configuration
```

4. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Configuration

Configuration is managed through environment variables or a `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `HOST` | Server host | "0.0.0.0" |
| `API_KEYS` | Comma-separated list of valid API keys | - |
| `HYLAFAX_HOST` | HylaFax server hostname | "localhost" |
| `HYLAFAX_PORT` | HylaFax server port | 4559 |
| `HYLAFAX_USER` | HylaFax username | - |
| `HYLAFAX_PASSWORD` | HylaFax password | - |
| `MAX_RETRIES` | Maximum number of retry attempts | 12 |
| `LOG_LEVEL` | Logging level | "info" |

## Security Considerations

- All API endpoints require authentication using API keys
- Input validation is performed on all incoming requests
- Document content is sanitized before processing
- Comprehensive logging for audit trails
- No sensitive information is stored long-term

## Workflow

1. Client authenticates and sends fax content to `/fax/send`
2. Server converts content to faxable format
3. Server submits fax to HylaFax and stores job details
4. HylaFax sends status updates to `/fax/status`
5. Server forwards status updates to client's callback URL
6. Final status (success/failure) is communicated back to client

## Development

### Adding New Document Types

To add support for additional document types, extend the converter module in `src/services/converter.js`.

### Testing

```bash
npm test
```

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Additional Resources

- [Getting Started Guide](docs/getting-started.md) - Detailed instructions for setting up and using the gateway
- [Example Code](examples/) - Sample code for sending faxes and integrating with your application
- [API Collection](docs/postman-collection.json) - Postman collection for testing the API
- [Docker Support](Dockerfile) - Containerize the application for easy deployment
- [Tests](test/) - Test cases demonstrating the functionality

## Quick Start with Docker

The fastest way to get started is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/yourusername/fastify-hylafax-gateway.git
cd fastify-hylafax-gateway

# Configure your API keys and HylaFax server details
cp src/.env.example .env
nano .env

# Start the container
docker-compose up -d
```

Visit http://localhost:3000/documentation to see the API documentation.
