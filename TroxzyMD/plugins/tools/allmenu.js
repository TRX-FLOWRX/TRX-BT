const userModel = require('../../lib/userModel');
const navSession = require('../../lib/navSessionManager');

const MENU_SESSION_TTL = 3 * 60 * 1000;

module.exports = {
    command: ['allmenu', 'fullmenu', 'semuamenu'],
    category: 'main',
    description: 'Menampilkan SEMUA command bot, dikelompokkan per kategori (interaktif, reply angka)',
    cooldown: 3,
    limitCost: 0,
    execute: async (msg, { sock, jid, sender }) => {
        const { getPlugins } = require('../../lib/connection');
        const { allPlugins } = getPlugins();
        const menuPlugin = require('./menu.js');
        const user = userModel.getUser(sender);

        const { text, categories, grouped } = menuPlugin._buildFullCategoryListText(user, allPlugins);

        navSession.registerSession('menu', jid, {
            categories,
            grouped,
            expiresAt: Date.now() + MENU_SESSION_TTL,
        });

        await sock.sendMessage(jid, { text }, { quoted: msg });
    }
};
