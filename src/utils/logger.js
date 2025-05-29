import pino from 'pino';

/**
 * Configure the pino logger with the appropriate log level and formatting
 * @param {string} level - Log level (debug, info, warn, error)
 * @returns {Object} - Configured pino logger instance
 */
export function configureLogger(level = 'info') {
  return pino({
    level,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  });
}
