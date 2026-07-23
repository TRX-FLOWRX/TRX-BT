import { promises as fs } from 'fs';
import path from 'path';
import { default: makeWASocket, useSingleFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import logger from './core/logger.js';
import config from './config/config.js';
import eventBus from './core/eventBus.js';
import { initSqlite, initMongo, migrateDatabase } from './core/database.js';
import { initTelegram, notifyOwner } from './services/telegramService.js';
import { initApiServer } from './services/apiService.js';
import { loadPlugins } from './core/pluginLoader.js';
import { handleMessage } from './handlers/messageHandler.js';
import { handleGroupUpdate } from './handlers/groupHandler.js';

const authFile = path.resolve(process.cwd(), `${config.whatsapp.sessionName}.json`);
const { state, saveState } = useSingleFileAuthState(authFile);

async function init() {
  process.on('uncaughtException', async (error) => {
    logger.error({ error }, 'uncaughtException');
    await notifyOwner(`uncaughtException: ${error.message}`);
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason) => {
    logger.error({ reason }, 'unhandledRejection');
    await notifyOwner(`unhandledRejection: ${reason}`);
  });

  await migrateDatabase();
  initSqlite();
  await initMongo();
  initTelegram();
  initApiServer();
  await loadPlugins();

  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['TroxzyMD', 'Chrome', '1.0.0'],
    logger: undefined,
    connectTimeoutMs: 60000
  });

  socket.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      qrcode.generate(qr, { small: true });
      logger.info('QR code generated');
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      logger.warn({ lastDisconnect }, 'WhatsApp connection closed');
      if (shouldReconnect) {
        setTimeout(() => init(), 5000);
      }
    }

    if (connection === 'open') {
      logger.info('WhatsApp connected');
    }
  });

  socket.ev.on('creds.update', saveState);

  socket.ev.on('messages.upsert', async (msg) => {
    const messages = msg.messages || [];
    for (const message of messages) {
      const jid = message.key.remoteJid;
      if (!jid) continue;
      await handleMessage({ message: message.message, jid, sendMessage: async (recipient, text) => {
        await socket.sendMessage(recipient, { text });
      } });
    }
  });

  socket.ev.on('groups.update', async (update) => {
    await handleGroupUpdate(update);
  });
}

init().catch((error) => {
  logger.error({ error }, 'Application failed to start');
});
