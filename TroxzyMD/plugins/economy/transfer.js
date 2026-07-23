const userModel = require('../../lib/userModel');

module.exports = {
    command: ['transfer', 'kirimuang'],
    category: 'economy',
    description: 'Transfer balance ke user lain',
    limitCost: 0,
    execute: async (msg, { sock, jid, args, sender }) => {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const amount = parseInt(args[mentioned ? 1 : 0]);

        if (!mentioned || isNaN(amount) || amount <= 0) {
            return sock.sendMessage(jid, { text: '📝 Format: *.transfer @user <jumlah>*\nContoh: .transfer @user 5000' }, { quoted: msg });
        }

        const senderData = userModel.getUser(sender);
        if (senderData.balance < amount) {
            return sock.sendMessage(jid, { text: `❌ Balance kamu tidak cukup. Balance saat ini: Rp${senderData.balance.toLocaleString('id-ID')}` }, { quoted: msg });
        }

        userModel.addBalance(sender, -amount);
        userModel.addBalance(mentioned, amount);

        await sock.sendMessage(jid, {
            text: `✅ Berhasil transfer Rp${amount.toLocaleString('id-ID')} ke @${mentioned.split('@')[0]}`,
            mentions: [mentioned]
        }, { quoted: msg });
    }
};
