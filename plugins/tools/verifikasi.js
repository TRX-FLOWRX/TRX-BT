const config = require('../../config/config');
const userModel = require('../../lib/userModel');

module.exports = {
    command: ['verifikasi', 'verify'],
    category: 'tools',
    description: 'Mengirim bukti follow channel untuk verifikasi manual owner',
    limitCost: 0,
    execute: async (msg, { sock, jid, sender }) => {
        const user = userModel.getUser(sender);

        if (!user.registered) {
            return sock.sendMessage(jid, { text: '❌ Kamu belum registrasi. Ketik *.register <nama>* dulu.' }, { quoted: msg });
        }
        if (user.channelVerified) {
            return sock.sendMessage(jid, { text: '✅ Kamu sudah terverifikasi. Ketik *.menu* untuk mulai pakai bot.' }, { quoted: msg });
        }

        const hasImage = !!msg.message?.imageMessage;
        const quotedHasImage = !!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

        if (!hasImage && !quotedHasImage) {
            return sock.sendMessage(jid, {
                text: `📸 Kirim/reply screenshot bukti kamu sudah follow channel dengan caption *.verifikasi*\n\nBelum follow? Follow dulu di sini:\n${config.channelLink}`
            }, { quoted: msg });
        }

        // Forward bukti ke owner untuk approve manual
        const ownerJid = config.ownerNumber + '@s.whatsapp.net';
        const notifText = `🔔 *VERIFIKASI CHANNEL BARU*\n\n`
            + `👤 User    : @${sender.split('@')[0]}\n`
            + `📛 Nama    : ${user.name}\n`
            + `🎁 Referral: ${user.referredBy ? '@' + user.referredBy.split('@')[0] : 'Tidak ada'}\n\n`
            + `✅ Approve : *.approvechannel ${sender.split('@')[0]}*\n`
            + `❌ Reject  : *.rejectchannel ${sender.split('@')[0]} <alasan>*`;

        try {
            await sock.sendMessage(ownerJid, {
                text: notifText,
                mentions: [sender, ...(user.referredBy ? [user.referredBy] : [])]
            });
            await sock.sendMessage(ownerJid, { forward: msg });
        } catch (err) {
            console.error('[VERIFIKASI FORWARD ERROR]', err.message);
        }

        await sock.sendMessage(jid, {
            text: `✅ Bukti verifikasi kamu telah diteruskan ke owner.\n\nMohon tunggu, kamu akan diberi tahu otomatis setelah disetujui.`
        }, { quoted: msg });
    }
};
