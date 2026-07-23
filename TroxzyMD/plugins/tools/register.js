const userModel = require('../../lib/userModel');
const config = require('../../config/config');

module.exports = {
    command: ['register', 'daftar'],
    category: 'tools',
    description: 'Mendaftar untuk bisa memakai bot (wajib sebelum pakai fitur lain)',
    limitCost: 0,
    execute: async (msg, { sock, jid, text, sender }) => {
        const user = userModel.getUser(sender);

        if (user.registered && user.channelVerified) {
            return sock.sendMessage(jid, {
                text: `✅ Kamu sudah terdaftar dan terverifikasi sebagai *${user.name}*.\n\nKetik *.menu* untuk mulai pakai bot.`
            }, { quoted: msg });
        }

        if (!text) {
            let helpText = `📝 *CARA REGISTRASI*\n\n`;
            helpText += `Format: *.register <nama>|<kode_referral(opsional)>*\n\n`;
            helpText += `Contoh tanpa referral:\n.register Budi\n\n`;
            helpText += `Contoh dengan referral:\n.register Budi|ABCD1234\n\n`;
            helpText += `⚠️ Setelah registrasi, kamu WAJIB:\n`;
            helpText += `1️⃣ Follow channel WhatsApp owner (link akan diberikan)\n`;
            helpText += `2️⃣ Kirim screenshot bukti follow ke bot ini\n`;
            helpText += `3️⃣ Tunggu verifikasi manual dari owner\n\n`;
            helpText += `Bot baru bisa dipakai penuh setelah verifikasi selesai.`;
            return sock.sendMessage(jid, { text: helpText }, { quoted: msg });
        }

        const [namePart, referralPart] = text.split('|').map(s => s.trim());

        if (!namePart || namePart.length < 2) {
            return sock.sendMessage(jid, { text: '❌ Nama minimal 2 karakter. Format: *.register <nama>|<kode_referral(opsional)>*' }, { quoted: msg });
        }

        // ===== PROSES KODE REFERRAL (jika ada) =====
        let referrerJid = null;
        if (referralPart) {
            if (!user.registered) { // referral cuma diproses sekali, saat registrasi pertama
                const referrer = userModel.findUserByReferralCode(referralPart);
                if (!referrer) {
                    return sock.sendMessage(jid, { text: `❌ Kode referral "${referralPart}" tidak ditemukan. Cek lagi kode-nya, atau registrasi tanpa kode referral.` }, { quoted: msg });
                }
                if (referrer.jid === sender) {
                    return sock.sendMessage(jid, { text: '❌ Tidak bisa pakai kode referral milik sendiri.' }, { quoted: msg });
                }
                referrerJid = referrer.jid;
            }
        }

        userModel.updateUser(sender, {
            name: namePart,
            registered: true,
            ...(referrerJid ? { referredBy: referrerJid } : {}),
        });

        let responseText = `✅ Registrasi tahap 1 berhasil, halo *${namePart}*!\n\n`;
        responseText += `📢 *LANGKAH TERAKHIR (WAJIB):*\n`;
        responseText += `1️⃣ Follow channel WhatsApp kami:\n${config.channelLink}\n\n`;
        responseText += `2️⃣ Screenshot bukti kamu sudah follow (halaman channel yang menampilkan status "Mengikuti")\n\n`;
        responseText += `3️⃣ Kirim screenshot itu ke chat ini dengan caption *.verifikasi*\n\n`;
        responseText += `Setelah owner approve, kamu baru bisa pakai semua fitur bot.`;

        if (referrerJid) {
            responseText += `\n\n🎁 Kamu terdaftar lewat referral dari @${referrerJid.split('@')[0]}. Setelah verifikasi channel kamu selesai, mereka otomatis dapat reward.`;
        }

        await sock.sendMessage(jid, { text: responseText, mentions: referrerJid ? [referrerJid] : [] }, { quoted: msg });
    }
};
