import { backupDatabase } from '../src/core/database.js';

(async () => {
  try {
    const path = await backupDatabase();
    console.log('Backup created at', path);
    process.exit(0);
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
})();
