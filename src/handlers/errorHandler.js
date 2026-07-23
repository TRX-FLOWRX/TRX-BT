import logger from '../core/logger.js';
import { notifyOwner } from '../services/telegramService.js';

export async function handleError(error, context = {}) {
  logger.error({ error, ...context }, 'Global error handler');
  await notifyOwner(`Error in TroxzyMD: ${error.message || 'Unknown error'}`);
}

export function wrapAsync(fn) {
  return async function wrapped(...args) {
    try {
      return await fn(...args);
    } catch (error) {
      await handleError(error, { args });
      return null;
    }
  };
}
