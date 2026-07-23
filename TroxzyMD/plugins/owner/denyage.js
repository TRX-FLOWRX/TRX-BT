const ageVerification = require('../../lib/ageVerification');

module.exports = {
    command: ['denyage', 'rejectage'],
    category: 'owner',
    description: 'Menolak permintaan verifikasi usia 18+ (owner only)',
    ownerOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const target = args[0];
        const reason = args.slice(1).join(' ') || 'Tidak dijelaskan';
        if (!target) {
            return sock.sendMessage(jid, { text: '📝 Format: *.denyage <nomor> <alasan>*' }, { quoted: msg });
        }
        const cleanJid = target.includes('@') ? target : `${target.replace(/\D/g, '')}@s.whatsapp.net`;
        const success = ageVerification.denyAgeVerification(cleanJid, reason);
        if (!success) {
            return sock.sendMessage(jid, { text: `❌ Gagal menolak ${cleanJid}. Pastikan user sudah meminta verifikasi.` }, { quoted: msg });
        }
        await sock.sendMessage(jid, { text: `✅ Permintaan verifikasi usia untuk ${cleanJid} ditolak.` }, { quoted: msg });
        try {
            await sock.sendMessage(cleanJid, { text: `❌ Permintaan verifikasi usia 18+ ditolak. Alasan: ${reason}` });
        } catch (_) {}
    }
};
