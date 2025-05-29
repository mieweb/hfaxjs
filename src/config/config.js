/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  apiKeys: process.env.API_KEYS ? process.env.API_KEYS.split(',') : [],
  hylafax: {
    host: process.env.HYLAFAX_HOST || 'localhost',
    port: process.env.HYLAFAX_PORT || 4559,
    user: process.env.HYLAFAX_USER || '',
    password: process.env.HYLAFAX_PASSWORD || '',
    useSSL: process.env.HYLAFAX_USE_SSL === 'true',
    defaultResolution: process.env.DEFAULT_RESOLUTION || 'medium',
    defaultPriority: process.env.DEFAULT_PRIORITY ? parseInt(process.env.DEFAULT_PRIORITY, 10) : 127
  },
  maxRetries: process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES, 10) : 12,
  logLevel: process.env.LOG_LEVEL || 'info',
  maxFileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE, 10) : 10485760, // 10MB
  enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
  cors: {
    origin: process.env.CORS_ORIGIN || true
  },
  storageDir: process.env.STORAGE_DIR || '/tmp/faxjsgw'
};

/**
 * Load configuration from environment variables and override with provided options
 * @param {Object} options - User-provided configuration options
 * @returns {Object} - Merged configuration object
 */
export function loadConfig(options = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...options,
    hylafax: {
      ...DEFAULT_CONFIG.hylafax,
      ...(options.hylafax || {})
    },
    cors: {
      ...DEFAULT_CONFIG.cors,
      ...(options.cors || {})
    }
  };
}
