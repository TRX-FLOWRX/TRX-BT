const userModel = require('../../lib/userModel');

module.exports = {
    command: ['unban'],
    category: 'owner',
    description: 'Menghapus banned status user (owner only)',
    ownerOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const target = mentioned || (args[0] ? `${args[0].replace(/\D/g, '')}@s.whatsapp.net` : null);

        if (!target) {
            return sock.sendMessage(jid, { text: '📝 Format: *.unban <nomor/tag>*' }, { quoted: msg });
        }

        userModel.updateUser(target, { banned: false, banReason: '' });
        await sock.sendMessage(jid, {
            text: `✅ @${target.split('@')[0]} telah di-unban.`,
            mentions: [target]
        }, { quoted: msg });
    }
};
