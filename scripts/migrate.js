import { migrateDatabase } from '../src/core/database.js';

(async () => {
  try {
    await migrateDatabase();
    console.log('Database migration completed.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
