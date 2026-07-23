const userModel = require('../../lib/userModel');
const db = require('../../lib/database');

const DAILY_REWARD = 5000;
const COOLDOWN_HOURS = 24;

module.exports = {
    command: ['daily', 'claim'],
    category: 'economy',
    description: 'Klaim reward harian',
    limitCost: 0,
    execute: async (msg, { sock, jid, sender }) => {
        const user = userModel.getUser(sender);
        const lastClaim = user.lastDailyClaim || 0;
        const now = Date.now();
        const diffHours = (now - lastClaim) / (1000 * 60 * 60);

        if (diffHours < COOLDOWN_HOURS) {
            const remainingHours = Math.ceil(COOLDOWN_HOURS - diffHours);
            return sock.sendMessage(jid, {
                text: `⏳ Kamu sudah klaim daily reward hari ini.\nCoba lagi dalam ${remainingHours} jam.`
            }, { quoted: msg });
        }

        const newBalance = userModel.addBalance(sender, DAILY_REWARD);
        userModel.updateUser(sender, { lastDailyClaim: now });
        userModel.addXp(sender, 10);

        await sock.sendMessage(jid, {
            text: `🎁 *DAILY REWARD*\n\n+Rp${DAILY_REWARD.toLocaleString('id-ID')}\n+10 XP\n\n💰 Balance sekarang: Rp${newBalance.toLocaleString('id-ID')}\n\n_💡 Tip: balance bisa ditukar jadi limit bot pakai *.tukarlimit* (Rp1.000 = 10 limit)_`
        }, { quoted: msg });
    }
};
