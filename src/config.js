dotenv.config();

/**
 * Validates that a required environment variable exists
 * @param {string} key - Environment variable name
 * @param {string} description - Human readable description for error messages
 * @returns {string} The environment variable value
 */
function requireEnv(key, description) {
  const value = process.env[key];
  if (!value) {
    console.error(`❌ Missing required environment variable: ${key}`);
    console.error(`   Description: ${description}`);
    console.error(`   Add this to your .env file`);
    process.exit(1);
  }
  return value;
}

/**
 * Gets optional environment variable with default
 * @param {string} key - Environment variable name
 * @param {string} defaultValue - Default value if not set
 * @returns {string} The environment variable value or default
 */
function getEnv(key, defaultValue) {
  return process.env[key] || defaultValue;
}

// Validate and export configuration
export const config = {
  // Server settings
  server: {
    port: parseInt(getEnv('PORT', '3000')),
    env: getEnv('NODE_ENV', 'development'),
    isDev: getEnv('NODE_ENV', 'development') === 'development'
  },

  // Apify configuration
  apify: {
    token: requireEnv('APIFY_TOKEN', 'Apify API token for web scraping'),
    actor: getEnv('APIFY_ACTOR', 'apify/google-scholar-scraper'),
    maxResults: parseInt(getEnv('MAX_PAPERS_PER_QUERY', '5'))
  },

  // LLM configuration  
  llm: {
    provider: getEnv('LLM_PROVIDER', 'anthropic'),
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    openaiKey: process.env.OPENAI_API_KEY,
    model: getEnv('LLM_MODEL', 'claude-3-haiku-20240307')
  },

  // Embeddings configuration
  embeddings: {
    provider: getEnv('EMBEDDING_PROVIDER', 'openai'),
    apiKey: process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY,
    model: getEnv('EMBEDDING_MODEL', 'text-embedding-3-small')
  },

  // Redis configuration
  redis: {
    url: getEnv('REDIS_URL', 'redis://localhost:6379'),
    namespace: getEnv('REDIS_NAMESPACE', 'secscholar:'),
    ttl: parseInt(getEnv('REDIS_TTL', '86400')) // 24 hours
  },

  // Gladia TTS configuration
  gladia: {
    apiKey: process.env.GLADIA_API_KEY,
    voice: getEnv('GLADIA_VOICE', 'alloy'),
    endpoint: getEnv('GLADIA_ENDPOINT', 'https://api.gladia.io')
  },

  // Horizon3.ai security configuration
  horizon3: {
    apiKey: process.env.HORIZON3_API_KEY,
    endpoint: getEnv('HORIZON3_ENDPOINT', 'https://api.horizon3.ai/v1'),
    enabled: process.env.HORIZON3_API_KEY ? true : false
  },

  // Storage configuration
  storage: {
    audioPath: getEnv('STORAGE_PATH', './tmp/audio'),
    maxPdfSizeMB: parseInt(getEnv('MAX_PDF_SIZE_MB', '10'))
  },

  // Demo configuration
  demo: {
    enabled: getEnv('DEMO_MODE', 'false') === 'true',
    preloadTopics: getEnv('PRELOAD_TOPICS', '').split(',').filter(Boolean)
  }
};

// Validate LLM configuration
if (!config.llm.anthropicKey && !config.llm.openaiKey) {
  console.error('❌ No LLM API key found. Set either ANTHROPIC_API_KEY or OPENAI_API_KEY');
  process.exit(1);
}

// Validate embeddings configuration
if (!config.embeddings.apiKey) {
  console.error('❌ No embeddings API key found. Set EMBEDDING_API_KEY or OPENAI_API_KEY');
  process.exit(1);
}

// Create storage directories
try {
  fs.mkdirSync(config.storage.audioPath, { recursive: true });
  console.log(`✅ Audio storage directory ready: ${config.storage.audioPath}`);
} catch (error) {
  console.error(`❌ Failed to create storage directory: ${error.message}`);
  process.exit(1);
}

// Log configuration (without sensitive values)
if (config.server.isDev) {
  console.log('🔧 SecureScholar Configuration:');
  console.log(`   Server: http://localhost:${config.server.port}`);
  console.log(`   LLM Provider: ${config.llm.provider}`);
  console.log(`   Embeddings: ${config.embeddings.provider}/${config.embeddings.model}`);
  console.log(`   Redis: ${config.redis.url.replace(/\/\/.*@/, '//***@')}`);
  console.log(`   Horizon3.ai: ${config.horizon3.enabled ? 'enabled' : 'disabled (will mock)'}`);
  console.log(`   Gladia TTS: ${config.gladia.apiKey ? 'enabled' : 'disabled (will mock)'}`);
  console.log(`   Demo Mode: ${config.demo.enabled ? 'enabled' : 'disabled'}`);
}