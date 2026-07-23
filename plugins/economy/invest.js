const userModel = require('../../lib/userModel');
const sqlite = require('../../lib/sqlite');

module.exports = {
    command: ['invest', 'investasi'],
    category: 'economy',
    description: 'Menanamkan modal di bank dan dapatkan pengembalian dalam 1 jam.',
    limitCost: 0,
    execute: async (msg, { sock, args, sender, jid }) => {
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) {
            return sock.sendMessage(jid, { text: '📝 Gunakan: *.invest <jumlah>*' }, { quoted: msg });
        }

        const user = userModel.getUser(sender);
        if (user.balance < amount) {
            return sock.sendMessage(jid, { text: `❌ Saldo tidak cukup. Saldo kamu: Rp${user.balance.toLocaleString('id-ID')}` }, { quoted: msg });
        }

        userModel.addBalance(sender, -amount);
        const returnsDue = Date.now() + 60 * 60 * 1000;
        const stmt = sqlite.prepare('INSERT INTO investments (jid, amount, invested_at, returns_due, status) VALUES (?, ?, ?, ?, ?)');
        stmt.run(sender, amount, Date.now(), returnsDue, 'pending');

        await sock.sendMessage(jid, {
            text: `✅ Investasi Rp${amount.toLocaleString('id-ID')} berhasil dicatat. Kamu akan menerima hasil dalam 1 jam.`
        }, { quoted: msg });
    }
};
