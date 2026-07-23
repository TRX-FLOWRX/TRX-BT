import path from 'path';
import { makeWASocket, DisconnectReason, useSingleFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import config from '../config/config.js';
import logger from './logger.js';

const authFile = path.resolve(process.cwd(), `${config.whatsapp.sessionName}.json`);
export const { state, saveState } = useSingleFileAuthState(authFile);

export function createConnection({ onMessage, onGroupUpdate }) {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['TroxzyMD', 'Chrome', '1.0.0'],
    connectTimeoutMs: 60000
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      qrcode.generate(qr, { small: true });
      logger.info('QR code generated');
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      logger.warn({ lastDisconnect }, 'WhatsApp connection closed');
      if (shouldReconnect) {
        setTimeout(() => createConnection({ onMessage, onGroupUpdate }), 5000);
      }
    }
    if (connection === 'open') {
      logger.info('WhatsApp connected');
    }
  });

  sock.ev.on('creds.update', saveState);
  sock.ev.on('messages.upsert', async (msg) => {
    const messages = msg.messages || [];
    for (const message of messages) {
      const jid = message.key.remoteJid;
      if (!jid) continue;
      await onMessage({ message: message.message, jid, sendMessage: async (recipient, text) => {
        await sock.sendMessage(recipient, { text });
      } });
    }
  });

  sock.ev.on('groups.update', async (update) => {
    await onGroupUpdate(update);
  });

  return sock;
}
