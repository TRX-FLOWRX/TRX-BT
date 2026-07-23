import logger from '../core/logger.js';
import { wrapAsync } from './errorHandler.js';

export const handleGroupUpdate = wrapAsync(async (update) => {
  logger.info({ update }, 'Group update received');
});
