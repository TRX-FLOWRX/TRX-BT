const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const pluginsDir = path.join(__dirname, '..', 'plugins');

/**
 * Setiap file plugin harus export object dengan struktur:
 * {
 *   command: ['menu', 'help'],       // array alias command
 *   category: 'main',                 // kategori untuk grouping di menu
 *   description: 'Menampilkan menu',  // dipakai di /menu
 *   premium: false,                   // true = khusus user premium
 *   ownerOnly: false,                 // true = khusus owner
 *   groupOnly: false,                 // true = hanya jalan di grup
 *   privateOnly: false,               // true = hanya jalan di chat pribadi
 *   adminOnly: false,                 // true = khusus admin grup
 *   cooldown: 0,                      // detik cooldown antar penggunaan
 *   execute: async (msg, { sock, args, text, ...ctx }) => { ... }
 * }
 */
function loadPlugins() {
    const commandMap = new Map(); // command -> plugin
    const allPlugins = [];
    let loadedCount = 0;
    let failedCount = 0;

    const categories = fs.readdirSync(pluginsDir).filter(f =>
        fs.statSync(path.join(pluginsDir, f)).isDirectory()
    );

    for (const category of categories) {
        const categoryPath = path.join(pluginsDir, category);
        const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));

        for (const file of files) {
            const fullPath = path.join(categoryPath, file);
            try {
                delete require.cache[require.resolve(fullPath)];
                const plugin = require(fullPath);

                if (!plugin.command || !Array.isArray(plugin.command)) {
                    console.log(chalk.yellow(`[SKIP] ${category}/${file} — tidak punya array 'command'`));
                    continue;
                }
                if (typeof plugin.execute !== 'function') {
                    console.log(chalk.yellow(`[SKIP] ${category}/${file} — tidak punya fungsi 'execute'`));
                    continue;
                }

                plugin._category = plugin.category || category;
                plugin._file = file;

                for (const cmd of plugin.command) {
                    if (commandMap.has(cmd.toLowerCase())) {
                        console.log(chalk.red(`[CONFLICT] Command '${cmd}' di ${file} bentrok dengan plugin lain, dilewati.`));
                        continue;
                    }
                    commandMap.set(cmd.toLowerCase(), plugin);
                }

                allPlugins.push(plugin);
                loadedCount++;
            } catch (err) {
                failedCount++;
                console.log(chalk.red(`[ERROR] Gagal load ${category}/${file}: ${err.message}`));
            }
        }
    }

    console.log(chalk.green(`✔ ${loadedCount} plugin berhasil dimuat`) + (failedCount ? chalk.red(` | ${failedCount} gagal`) : ''));
    return { commandMap, allPlugins };
}

module.exports = { loadPlugins };
