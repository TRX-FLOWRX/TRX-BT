const userModel = require('../../lib/userModel');

const DURATION_MAP = {
    '7': 7 * 24 * 60 * 60 * 1000,
    '30': 30 * 24 * 60 * 60 * 1000,
    '90': 90 * 24 * 60 * 60 * 1000,
    '0': 0, // lifetime
};

module.exports = {
    command: ['addpremium', 'addprem'],
    category: 'owner',
    description: 'Menambahkan premium ke user secara manual (owner only)',
    ownerOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const target = mentioned || (args[0] ? `${args[0].replace(/\D/g, '')}@s.whatsapp.net` : null);
        const days = args[1] || '30';

        if (!target) {
            return sock.sendMessage(jid, {
                text: '📝 Format: *.addpremium <nomor> <hari>*\nAtau tag/reply user: *.addpremium @user <hari>*\n\nHari: 7, 30, 90, atau 0 (lifetime)'
            }, { quoted: msg });
        }

        const duration = DURATION_MAP[days] ?? (parseInt(days) * 24 * 60 * 60 * 1000);
        userModel.setPremium(target, duration);

        await sock.sendMessage(jid, {
            text: `✅ @${target.split('@')[0]} berhasil diupgrade ke Premium (${days === '0' ? 'Lifetime' : days + ' hari'}).`,
            mentions: [target]
        }, { quoted: msg });

        try {
            await sock.sendMessage(target, { text: `🎉 Kamu telah diupgrade menjadi *Premium* oleh owner!` });
        } catch (_) {}
    }
};
