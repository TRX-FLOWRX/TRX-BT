import { restoreDatabase } from '../src/core/database.js';

(async () => {
  try {
    const path = await restoreDatabase();
    console.log('Database restored from', path);
    process.exit(0);
  } catch (error) {
    console.error('Restore failed:', error);
    process.exit(1);
  }
})();
