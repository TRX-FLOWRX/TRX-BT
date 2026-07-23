const userModel = require('../../lib/userModel');
const vault = require('../../lib/vault');

module.exports = {
    command: ['balance', 'saldo'],
    category: 'economy',
    description: 'Menampilkan saldo utama dan saldo vault kamu.',
    limitCost: 0,
    execute: async (msg, { sock, sender, jid }) => {
        const user = userModel.getUser(sender);
        const vaultBalance = vault.getBalance(sender);
        const text = `💰 *Saldo Utama*: Rp${user.balance.toLocaleString('id-ID')}\n` +
            `🏦 *Saldo Vault*: Rp${vaultBalance.toLocaleString('id-ID')}\n` +
            `🔔 Kamu bisa menggunakan *.shop* untuk beli item, atau *.invest <jumlah>* untuk investasi.`;
        await sock.sendMessage(jid, { text }, { quoted: msg });
    }
};
