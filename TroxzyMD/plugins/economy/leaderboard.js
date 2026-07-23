const db = require('../../lib/database');

module.exports = {
    command: ['leaderboard', 'lb', 'top'],
    category: 'economy',
    description: 'Menampilkan peringkat balance/level tertinggi',
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const mode = (args[0] || 'balance').toLowerCase();
        const allUsers = Object.values(db.users.getAll());

        const sorted = allUsers
            .sort((a, b) => mode === 'level' ? (b.level - a.level || b.xp - a.xp) : b.balance - a.balance)
            .slice(0, 10);

        if (sorted.length === 0) {
            return sock.sendMessage(jid, { text: '📭 Belum ada data.' }, { quoted: msg });
        }

        let text = `🏆 *LEADERBOARD ${mode === 'level' ? 'LEVEL' : 'BALANCE'}*\n\n`;
        sorted.forEach((u, i) => {
            const medal = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
            const value = mode === 'level' ? `Level ${u.level} (${u.xp} XP)` : `Rp${u.balance.toLocaleString('id-ID')}`;
            text += `${medal} @${u.jid.split('@')[0]} — ${value}\n`;
        });

        await sock.sendMessage(jid, { text, mentions: sorted.map(u => u.jid) }, { quoted: msg });
    }
};
