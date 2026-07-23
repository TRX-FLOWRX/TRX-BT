import logger from '../core/logger.js';
import { wrapAsync } from './errorHandler.js';
import { getAllPlugins } from '../core/pluginLoader.js';
import { getState } from '../core/stateManager.js';
import config from '../config/config.js';

export const commandHandler = wrapAsync(async ({ message, jid, command, args, sendMessage }) => {
  const state = getState();
  const plugin = getAllPlugins().find((plugin) => plugin.command === command && plugin.enabled !== false);
  if (!plugin) {
    await sendMessage(jid, 'Perintah tidak dikenali. Ketik menu untuk daftar fitur.');
    return;
  }

  if (state.cooldowns.has(jid) && state.cooldowns.get(jid) > Date.now()) {
    await sendMessage(jid, 'Tunggu beberapa detik sebelum mengirim perintah lagi.');
    return;
  }

  const user = state.users.get(jid) || { premium: false, used: 0 };
  const limit = user.premium ? config.limits.premiumDaily : config.limits.freeDaily;
  if (user.used >= limit) {
    await sendMessage(jid, 'Limit harian Anda telah tercapai.');
    return;
  }

  try {
    await plugin.execute({ message, jid, args, sendMessage, config });
    user.used += 1;
    state.users.set(jid, user);
    state.cooldowns.set(jid, Date.now() + config.limits.cooldownSeconds * 1000);
  } catch (error) {
    logger.error({ error, plugin: plugin.name }, 'Plugin execution failed');
    await sendMessage(jid, 'Terjadi kesalahan saat menjalankan perintah.');
  }
});
