import logger from '../core/logger.js';
import { wrapAsync } from './errorHandler.js';
import { commandHandler } from './commandHandler.js';
import { getPlugin } from '../core/pluginLoader.js';

export const handleMessage = wrapAsync(async ({ message, jid, sendMessage }) => {
  if (!message || !message.conversation) return;

  const content = message.conversation.trim();
  const [command, ...args] = content.split(/\s+/);
  if (command.startsWith('.') || command.startsWith('/')) {
    const key = command.replace(/^\.|\//, '').toLowerCase();
    await commandHandler({ message, jid, command: key, args, sendMessage });
    return;
  }

  const menuPlugin = getPlugin('menu');
  if (content.toLowerCase() === 'menu' && menuPlugin) {
    await menuPlugin.execute({ message, jid, args, sendMessage });
    return;
  }

  if (content.toLowerCase() === 'hi') {
    await sendMessage(jid, 'Halo! Ketik menu untuk melihat daftar perintah.');
  }
});
