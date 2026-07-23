const ageVerification = require('../../lib/ageVerification');

module.exports = {
    command: ['approveage', 'approve18'],
    category: 'owner',
    description: 'Menyetujui permintaan verifikasi usia 18+ (owner only)',
    ownerOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const target = args[0];
        if (!target) {
            return sock.sendMessage(jid, { text: '📝 Format: *.approveage <nomor>*' }, { quoted: msg });
        }
        const cleanJid = target.includes('@') ? target : `${target.replace(/\D/g, '')}@s.whatsapp.net`;
        const success = ageVerification.approveAgeVerification(cleanJid);
        if (!success) {
            return sock.sendMessage(jid, { text: `❌ Gagal approve ${cleanJid}. Pastikan user sudah meminta verifikasi.` }, { quoted: msg });
        }
        await sock.sendMessage(jid, { text: `✅ User ${cleanJid} telah disetujui sebagai 18+.` }, { quoted: msg });
        try {
            await sock.sendMessage(cleanJid, { text: '🎉 Verifikasi usia 18+ kamu telah disetujui. Kamu sekarang bisa mengakses fitur khusus 18+.' });
        } catch (_) {}
    }
};
