const userModel = require('../../lib/userModel');

const EXCHANGE_RATE = 1000; // Rp1000 = 10 limit
const LIMIT_PER_RATE = 10;

module.exports = {
    command: ['tukarlimit', 'exchangelimit'],
    category: 'economy',
    description: 'Menukar balance (hasil .daily, dll) menjadi limit bot — Rp1.000 = 10 limit',
    limitCost: 0,
    execute: async (msg, { sock, jid, args, sender }) => {
        const amount = parseInt(args[0]);

        if (!amount || isNaN(amount) || amount <= 0) {
            const user = userModel.getUser(sender);
            let text = `💱 *TUKAR BALANCE JADI LIMIT*\n\n`;
            text += `Rate: Rp${EXCHANGE_RATE.toLocaleString('id-ID')} = ${LIMIT_PER_RATE} limit\n`;
            text += `Balance kamu sekarang: Rp${user.balance.toLocaleString('id-ID')}\n`;
            text += `Limit kamu sekarang: ${user.dailyLimit}\n\n`;
            text += `📝 Format: *.tukarlimit <jumlah_rupiah>*\n`;
            text += `Contoh: .tukarlimit 5000 (jadi ${5000 / EXCHANGE_RATE * LIMIT_PER_RATE} limit)\n\n`;
            text += `_Minimal tukar: Rp${EXCHANGE_RATE.toLocaleString('id-ID')} (kelipatan Rp${EXCHANGE_RATE.toLocaleString('id-ID')})_`;
            return sock.sendMessage(jid, { text }, { quoted: msg });
        }

        if (amount % EXCHANGE_RATE !== 0) {
            return sock.sendMessage(jid, {
                text: `❌ Jumlah harus kelipatan Rp${EXCHANGE_RATE.toLocaleString('id-ID')} (misal: 1000, 2000, 5000, dst).`
            }, { quoted: msg });
        }

        const user = userModel.getUser(sender);
        if (user.balance < amount) {
            return sock.sendMessage(jid, {
                text: `❌ Balance kamu tidak cukup.\nBalance saat ini: Rp${user.balance.toLocaleString('id-ID')}\nDiminta: Rp${amount.toLocaleString('id-ID')}`
            }, { quoted: msg });
        }

        const limitGained = (amount / EXCHANGE_RATE) * LIMIT_PER_RATE;
        const newBalance = userModel.addBalance(sender, -amount);
        const newLimit = user.dailyLimit + limitGained;
        userModel.updateUser(sender, { dailyLimit: newLimit });

        await sock.sendMessage(jid, {
            text: `✅ Berhasil menukar Rp${amount.toLocaleString('id-ID')} menjadi *${limitGained} limit*!\n\n💰 Balance sekarang: Rp${newBalance.toLocaleString('id-ID')}\n⚡ Limit sekarang: ${newLimit}`
        }, { quoted: msg });
    }
};
