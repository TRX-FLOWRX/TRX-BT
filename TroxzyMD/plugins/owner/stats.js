const db = require('../../lib/database');
const os = require('os');
const { getFirstConnectedAt, getWarmupMultiplier } = require('../../lib/antiban');

module.exports = {
    command: ['stats', 'botstat'],
    category: 'owner',
    description: 'Menampilkan statistik penggunaan bot (owner only)',
    ownerOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid }) => {
        const allUsers = Object.values(db.users.getAll());
        const allGroups = Object.values(db.groups.getAll());
        const premiumUsers = allUsers.filter(u => u.premium);
        const bannedUsers = allUsers.filter(u => u.banned);

        const memUsage = process.memoryUsage();
        const usedMemMB = (memUsage.rss / 1024 / 1024).toFixed(1);
        const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(0);

        const firstConnect = getFirstConnectedAt();
        const warmupMultiplier = getWarmupMultiplier(firstConnect);
        const daysSinceConnect = firstConnect ? Math.floor((Date.now() - firstConnect) / (1000 * 60 * 60 * 24)) : null;
        const warmupStatus = warmupMultiplier >= 1
            ? '✅ Normal (bukan nomor baru / >7 hari)'
            : `⚠️ Warm-up hari ke-${daysSinceConnect + 1}/7 (limit ${Math.round(warmupMultiplier * 100)}%)`;

        const text = `╭─❍❁『 *BOT STATISTICS* 』❁❍\n`
            + `│ 👥 Total User    : ${allUsers.length}\n`
            + `│ 💎 Premium User  : ${premiumUsers.length}\n`
            + `│ 🚫 Banned User   : ${bannedUsers.length}\n`
            + `│ 🏘️ Total Grup    : ${allGroups.length}\n`
            + `│ 💾 Memory        : ${usedMemMB} MB / ${totalMemMB} MB\n`
            + `│ ⚙️ Node Version  : ${process.version}\n`
            + `│ ⏱️ Uptime        : ${Math.floor(process.uptime() / 60)} menit\n`
            + `│ 🛡️ Status Akun   : ${warmupStatus}\n`
            + `╰────────────────`;

        await sock.sendMessage(jid, { text }, { quoted: msg });
    }
};
