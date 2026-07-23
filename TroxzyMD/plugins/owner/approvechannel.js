const userModel = require('../../lib/userModel');
const db = require('../../lib/database');

/**
 * Membangun JID dari input nomor (menerima format dengan atau tanpa +,
 * spasi, strip, dll — semua karakter non-digit dibuang). TIDAK mengecek
 * apakah user itu ada di database — itu keputusan yang harus dibedakan
 * di execute(), karena "nomor tidak valid" dan "user belum pernah kirim
 * pesan ke bot" adalah dua masalah berbeda yang butuh pesan error berbeda.
 */
function buildJidFromNumber(numberOrJid) {
    if (numberOrJid.includes('@')) return numberOrJid;
    const cleanNumber = numberOrJid.replace(/\D/g, '');
    if (!cleanNumber) return null;
    return `${cleanNumber}@s.whatsapp.net`;
}

module.exports = {
    command: ['approvechannel', 'accchannel'],
    category: 'owner',
    description: 'Menyetujui verifikasi channel user (owner only)',
    ownerOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const target = mentioned || (args[0] ? buildJidFromNumber(args[0]) : null);

        if (!target) {
            return sock.sendMessage(jid, { text: '📝 Format: *.approvechannel <nomor>* atau tag user.\n\nContoh: .approvechannel 6285714999879\n(boleh pakai +, spasi, atau strip — akan dibersihkan otomatis)' }, { quoted: msg });
        }

        // Bedakan "user belum pernah kirim pesan ke bot sama sekali" dari
        // "format command salah" — dua masalah berbeda, dua pesan berbeda.
        // Sebelumnya kedua kasus ini salah ditampilkan sebagai "format salah"
        // yang membingungkan karena format yang diketik sudah benar.
        if (!db.users.has(target)) {
            return sock.sendMessage(jid, {
                text: `❓ Nomor ${target.split('@')[0]} belum pernah terdaftar di database bot (belum pernah kirim pesan apa pun ke bot, atau belum pernah *.register*).\n\nMinta orang tersebut kirim pesan apa saja ke bot dulu (misal *.menu*), baru bisa di-approve.`
            }, { quoted: msg });
        }

        const user = userModel.getUser(target);
        if (user.channelVerified) {
            return sock.sendMessage(jid, { text: `⚠️ User @${target.split('@')[0]} sudah terverifikasi sebelumnya.`, mentions: [target] }, { quoted: msg });
        }

        userModel.updateUser(target, { channelVerified: true, channelVerifiedAt: Date.now() });

        let responseText = `✅ @${target.split('@')[0]} berhasil diverifikasi.`;

        // Beri reward ke pereferensi (jika ada) SETELAH verifikasi channel selesai
        if (user.referredBy) {
            const newBalance = userModel.rewardReferral(user.referredBy);
            responseText += `\n🎁 Reward Rp1.500 diberikan ke @${user.referredBy.split('@')[0]} (balance sekarang: Rp${newBalance.toLocaleString('id-ID')})`;

            try {
                await sock.sendMessage(user.referredBy, {
                    text: `🎉 Referral kamu (@${target.split('@')[0]}) berhasil terverifikasi!\n\n+Rp1.500 masuk ke balance kamu.\nKetik *.profile* untuk cek saldo.`,
                    mentions: [target]
                });
            } catch (_) {}
        }

        await sock.sendMessage(jid, {
            text: responseText,
            mentions: [target, ...(user.referredBy ? [user.referredBy] : [])]
        }, { quoted: msg });

        try {
            await sock.sendMessage(target, {
                text: `🎉 Selamat! Verifikasi channel kamu telah disetujui.\n\nKamu sekarang bisa memakai semua fitur bot. Ketik *.menu* untuk mulai.`
            });
        } catch (err) {
            console.error('[NOTIFY VERIFIED ERROR]', err.message);
        }
    }
};
