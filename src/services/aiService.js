import axios from 'axios';
import config from '../config/config.js';
import logger from '../core/logger.js';

const headers = () => ({
  Authorization: `Bearer ${config.ai.apiKey}`,
  'Content-Type': 'application/json'
});

export async function queryAi(prompt, context = []) {
  if (!config.features.ai) {
    throw new Error('AI feature disabled');
  }

  try {
    const payload = {
      model: config.ai.model,
      messages: [{ role: 'system', content: 'You are TroxzyMD assistant.' }, ...context, { role: 'user', content: prompt }],
      max_tokens: config.ai.maxTokens,
      temperature: config.ai.temperature
    };

    const response = await axios.post(`${config.ai.baseUrl}/chat/completions`, payload, { headers: headers() });
    return response.data;
  } catch (error) {
    logger.error({ error }, 'AI request failed');
    throw error;
  }
}

export function buildConversationContext(history, maxEntries = 10) {
  return history.slice(-maxEntries).map((item) => ({ role: item.role, content: item.content }));
}
