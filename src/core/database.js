import Database from 'better-sqlite3';
import mongoose from 'mongoose';
import fs from 'fs-extra';
import path from 'path';
import config from '../config/config.js';
import logger from './logger.js';

const dbPath = path.resolve(process.cwd(), config.database.path);
fs.ensureDirSync(path.dirname(dbPath));
const sqlite = new Database(dbPath);

const models = {};

export function initSqlite() {
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return sqlite;
}

export async function initMongo() {
  if (!config.database.mongodbUri) {
    logger.info('MongoDB URI not configured, skipping MongoDB init');
    return null;
  }

  try {
    await mongoose.connect(config.database.mongodbUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000
    });
    logger.info('MongoDB connected');
    return mongoose;
  } catch (error) {
    logger.error({ error }, 'MongoDB connection failed');
    return null;
  }
}

export function getSqlite() {
  return sqlite;
}

export function registerModel(name, model) {
  models[name] = model;
}

export function getModel(name) {
  return models[name];
}

export async function migrateDatabase() {
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jid TEXT UNIQUE,
        name TEXT,
        is_premium INTEGER DEFAULT 0,
        daily_limit INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT UNIQUE,
        user_jid TEXT,
        package_name TEXT,
        amount INTEGER,
        status TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS plugins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        enabled INTEGER DEFAULT 1,
        meta TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info('SQLite schema ensured');
  } catch (error) {
    logger.error({ error }, 'SQLite migration failed');
    throw error;
  }
}

export async function backupDatabase(backupPath) {
  try {
    const destination = backupPath || path.resolve(process.cwd(), 'database/backups', `backup-${Date.now()}.db`);
    fs.copyFileSync(dbPath, destination);
    logger.info({ destination }, 'Database backup created');
    return destination;
  } catch (error) {
    logger.error({ error }, 'Database backup failed');
    throw error;
  }
}

export async function restoreDatabase(backupFile) {
  try {
    const source = backupFile || path.resolve(process.cwd(), 'database/backups', fs.readdirSync(path.resolve(process.cwd(), 'database/backups')).pop());
    fs.copyFileSync(source, dbPath);
    logger.info({ source }, 'Database restored from backup');
    return source;
  } catch (error) {
    logger.error({ error }, 'Database restore failed');
    throw error;
  }
}

process.on('exit', () => {
  sqlite.close();
});
