import logger from '../core/logger.js';
import { wrapAsync } from './errorHandler.js';

export const handleButton = wrapAsync(async ({ jid, buttonId, sendMessage }) => {
  logger.info({ jid, buttonId }, 'Button pressed');
  await sendMessage(jid, `Button ${buttonId} dipilih.`);
});
