import TelegramBot from 'node-telegram-bot-api';
import config from '../config/config.js';
import logger from '../core/logger.js';

let bot;

export function initTelegram() {
  if (!config.features.telegramBridge) {
    logger.info('Telegram bridge disabled');
    return null;
  }
  if (!config.telegram.token) {
    logger.warn('Telegram bot token not configured');
    return null;
  }

  bot = new TelegramBot(config.telegram.token, { polling: true });
  bot.on('message', async (msg) => {
    try {
      await handleTelegramCommand(msg);
    } catch (error) {
      logger.error({ error }, 'Telegram message handler failed');
    }
  });
  logger.info('Telegram bot started');
  return bot;
}

async function handleTelegramCommand(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  if (String(chatId) !== String(config.bot.ownerTelegramId)) {
    return;
  }

  if (text.startsWith('/stats')) {
    await bot.sendMessage(chatId, 'TroxzyMD is running.');
  } else if (text.startsWith('/broadcast')) {
    await bot.sendMessage(chatId, 'Broadcast command received.');
  } else if (text.startsWith('/restart')) {
    await bot.sendMessage(chatId, 'Restarting bot...');
    process.exit(0);
  }
}

export async function notifyOwner(message) {
  if (!bot) return;
  try {
    await bot.sendMessage(config.bot.ownerTelegramId, message);
  } catch (error) {
    logger.error({ error }, 'Telegram notification failed');
  }
}
