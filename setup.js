import { ensureFolders } from './src/utils/helpers.js';
import { migrateDatabase } from './src/core/database.js';
import logger from './src/core/logger.js';

(async () => {
  try {
    ensureFolders();
    await migrateDatabase();
    logger.info('Project setup completed.');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Setup failed');
    process.exit(1);
  }
})();
