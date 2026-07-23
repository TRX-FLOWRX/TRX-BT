import fs from 'fs-extra';
import path from 'path';
import logger from './logger.js';
import { getState } from './stateManager.js';
import eventBus from './eventBus.js';

const pluginsDir = path.resolve(process.cwd(), 'src/plugins');

export async function loadPlugins() {
  const state = getState();
  const categories = await fs.readdir(pluginsDir);
  for (const category of categories) {
    const categoryPath = path.join(pluginsDir, category);
    const stats = await fs.stat(categoryPath);
    if (!stats.isDirectory()) continue;

    const pluginFiles = await fs.readdir(categoryPath);
    for (const file of pluginFiles) {
      if (!file.endsWith('.js')) continue;
      const pluginPath = path.join(categoryPath, file);
      try {
        const module = await import(pluginPath);
        if (module.default && module.default.name) {
          state.plugins.set(module.default.name, module.default);
          logger.info({ plugin: module.default.name }, 'Loaded plugin');
          eventBus.emit('plugin:loaded', module.default.name);
        }
      } catch (error) {
        logger.error({ file: pluginPath, error }, 'Plugin load failed');
      }
    }
  }
}

export function getPlugin(name) {
  return getState().plugins.get(name);
}

export function getAllPlugins() {
  return Array.from(getState().plugins.values());
}
