const db = require('../../lib/database');

function buildJidFromNumber(numberOrJid) {
    if (numberOrJid.includes('@')) return numberOrJid;
    const cleanNumber = numberOrJid.replace(/\D/g, '');
    if (!cleanNumber) return null;
    return `${cleanNumber}@s.whatsapp.net`;
}

module.exports = {
    command: ['rejectchannel'],
    category: 'owner',
    description: 'Menolak verifikasi channel user (owner only)',
    ownerOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const target = mentioned || (args[0] ? buildJidFromNumber(args[0]) : null);
        const reason = args.slice(mentioned ? 0 : 1).join(' ') || 'Bukti follow channel tidak valid';

        if (!target) {
            return sock.sendMessage(jid, { text: '📝 Format: *.rejectchannel <nomor> <alasan>*\n\nContoh: .rejectchannel 6285714999879 screenshot tidak jelas' }, { quoted: msg });
        }

        if (!db.users.has(target)) {
            return sock.sendMessage(jid, {
                text: `❓ Nomor ${target.split('@')[0]} belum pernah terdaftar di database bot.`
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { text: `❌ Verifikasi @${target.split('@')[0]} ditolak.\nAlasan: ${reason}`, mentions: [target] }, { quoted: msg });

        try {
            await sock.sendMessage(target, {
                text: `❌ Maaf, verifikasi channel kamu ditolak.\nAlasan: ${reason}\n\nSilakan follow channel dengan benar lalu kirim ulang *.verifikasi* dengan screenshot yang jelas.`
            });
        } catch (err) {
            console.error('[NOTIFY REJECT CHANNEL ERROR]', err.message);
        }
    }
};
