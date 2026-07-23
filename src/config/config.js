import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const env = process.env;

export default {
  bot: {
    name: env.BOT_NAME || 'TroxzyMD',
    ownerName: env.OWNER_NAME || 'Troxzy',
    ownerNumber: env.OWNER_NUMBER || '6283140978382',
    ownerTelegramId: env.OWNER_TELEGRAM_ID || '5727720639',
    ownerTelegramUsername: env.OWNER_TELEGRAM_USERNAME || 't.me/SoloBanNoTrash'
  },
  whatsapp: {
    sessionName: env.WA_SESSION_NAME || 'troxzymd-session',
    autoRead: env.WA_AUTO_READ === 'true',
    typing: env.WA_TYPING === 'true',
    recording: env.WA_RECORDING === 'true'
  },
  ai: {
    baseUrl: env.AI_BASE_URL || 'https://api.freetheai.xyz/v1',
    apiKey: env.AI_API_KEY || '[ISI MANUAL NANTI]',
    model: env.AI_MODEL || 'gpt-4o-mini',
    maxTokens: Number(env.AI_MAX_TOKENS || 2000),
    temperature: Number(env.AI_TEMPERATURE || 0.7)
  },
  midtrans: {
    clientKey: env.MIDTRANS_CLIENT_KEY || '[ISI MANUAL NANTI]',
    serverKey: env.MIDTRANS_SERVER_KEY || '[ISI MANUAL NANTI]',
    isProduction: env.MIDTRANS_IS_PRODUCTION === 'true'
  },
  telegram: {
    token: env.TELEGRAM_BOT_TOKEN || '[ISI MANUAL NANTI]',
    webhookUrl: env.TELEGRAM_WEBHOOK_URL || ''
  },
  database: {
    type: env.DB_TYPE || 'sqlite',
    path: env.DB_PATH || './database/troxzymd.db',
    mongodbUri: env.MONGODB_URI || ''
  },
  redisUrl: env.REDIS_URL || '',
  api: {
    port: Number(env.API_PORT || 3000),
    secret: env.API_SECRET || '[ISI MANUAL NANTI]'
  },
  security: {
    encryptionKey: env.ENCRYPTION_KEY || '[ISI MANUAL NANTI]',
    jwtSecret: env.JWT_SECRET || '[ISI MANUAL NANTI]'
  },
  features: {
    ai: env.ENABLE_AI !== 'false',
    download: env.ENABLE_DOWNLOAD !== 'false',
    games: env.ENABLE_GAMES !== 'false',
    premium: env.ENABLE_PREMIUM !== 'false',
    telegramBridge: env.ENABLE_TELEGRAM_BRIDGE !== 'false'
  },
  limits: {
    freeDaily: Number(env.FREE_DAILY_LIMIT || 20),
    premiumDaily: Number(env.PREMIUM_DAILY_LIMIT || 9999),
    cooldownSeconds: Number(env.COOLDOWN_SECONDS || 3)
  }
};
