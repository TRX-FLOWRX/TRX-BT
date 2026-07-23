import config from './config.js';

export default {
  baseUrl: config.ai.baseUrl,
  apiKey: config.ai.apiKey,
  model: config.ai.model,
  maxTokens: config.ai.maxTokens,
  temperature: config.ai.temperature
};
