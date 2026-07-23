const userModel = require('../../lib/userModel');

const JOBS = {
    hunting: { label: '🏹 Berburu', min: 1000, max: 8000, cooldown: 30 * 60 * 1000 },
    mining: { label: '⛏️ Menambang', min: 2000, max: 12000, cooldown: 45 * 60 * 1000 },
    fishing: { label: '🎣 Memancing', min: 500, max: 6000, cooldown: 20 * 60 * 1000 },
};

module.exports = {
    command: ['hunting', 'mining', 'fishing'],
    category: 'rpg',
    description: 'Bekerja untuk mendapatkan uang (hunting/mining/fishing)',
    limitCost: 0,
    execute: async (msg, { sock, jid, sender, command }) => {
        const job = JOBS[command];
        const user = userModel.getUser(sender);
        const cooldownKey = `lastJob_${command}`;
        const lastTime = user[cooldownKey] || 0;
        const now = Date.now();
        const diff = now - lastTime;

        if (diff < job.cooldown) {
            const remainingMin = Math.ceil((job.cooldown - diff) / 60000);
            return sock.sendMessage(jid, { text: `⏳ Kamu masih lelah dari aktivitas ini.\nCoba lagi dalam ${remainingMin} menit.` }, { quoted: msg });
        }

        const earning = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
        userModel.addBalance(sender, earning);
        userModel.addXp(sender, 5);
        userModel.updateUser(sender, { [cooldownKey]: now });

        await sock.sendMessage(jid, {
            text: `${job.label}...\n\n✅ Berhasil mendapatkan Rp${earning.toLocaleString('id-ID')}!\n+5 XP`
        }, { quoted: msg });
    }
};
