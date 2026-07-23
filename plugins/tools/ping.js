const config = require('../../config/config');
const moment = require('moment-timezone');

module.exports = {
    command: ['ping'],
    category: 'tools',
    description: 'Cek kecepatan respon bot',
    limitCost: 0,
    execute: async (msg, { sock, jid }) => {
        const start = Date.now();
        const sent = await sock.sendMessage(jid, { text: '🏓 Pinging...' }, { quoted: msg });
        const speed = Date.now() - start;

        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        await sock.sendMessage(jid, {
            text: `🏓 *Pong!*\n⚡ Speed: ${speed}ms\n⏱️ Uptime: ${hours}j ${minutes}m ${seconds}d`,
            edit: sent.key,
        });
    }
};
