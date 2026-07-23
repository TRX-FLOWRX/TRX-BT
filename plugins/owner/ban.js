const userModel = require('../../lib/userModel');

module.exports = {
    command: ['ban', 'banuser'],
    category: 'owner',
    description: 'Mem-banned user dari penggunaan bot (owner only)',
    ownerOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const target = mentioned || (args[0] ? `${args[0].replace(/\D/g, '')}@s.whatsapp.net` : null);
        const reason = args.slice(1).join(' ') || 'Melanggar aturan penggunaan bot';

        if (!target) {
            return sock.sendMessage(jid, { text: '📝 Format: *.ban <nomor/tag> <alasan>*' }, { quoted: msg });
        }

        userModel.updateUser(target, { banned: true, banReason: reason });
        await sock.sendMessage(jid, {
            text: `🚫 @${target.split('@')[0]} telah di-banned.\nAlasan: ${reason}`,
            mentions: [target]
        }, { quoted: msg });
    }
};
