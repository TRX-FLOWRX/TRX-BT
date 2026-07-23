const db = require('../../lib/database');
const { throttledBroadcast } = require('../../lib/antiban');

module.exports = {
    command: ['broadcast', 'bc'],
    category: 'owner',
    description: 'Mengirim pesan ke semua user terdaftar (owner only)',
    ownerOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, text, args }) => {
        if (!text) {
            return sock.sendMessage(jid, {
                text: '📝 Format: *.broadcast <pesan>*\n\n⚠️ Broadcast adalah aktivitas PALING BERISIKO untuk kena blokir WhatsApp. Bot sudah otomatis pakai delay acak + jeda istirahat, tapi tetap disarankan HANYA untuk user yang benar-benar terdaftar/pernah interaksi, bukan nomor asing/scraping.\n\nKonfirmasi dengan: *.broadcast confirm <pesan>*'
            }, { quoted: msg });
        }

        if (args[0]?.toLowerCase() !== 'confirm') {
            return sock.sendMessage(jid, {
                text: `⚠️ Broadcast akan dikirim ke semua user terdaftar dan makan waktu cukup lama (delay natural antar pesan untuk keamanan akun).\n\nKetik ulang dengan konfirmasi:\n*.broadcast confirm ${text}*`
            }, { quoted: msg });
        }

        const actualText = args.slice(1).join(' ');
        if (!actualText) {
            return sock.sendMessage(jid, { text: '📝 Pesan broadcast tidak boleh kosong setelah "confirm".' }, { quoted: msg });
        }

        const allUsers = Object.keys(db.users.getAll());

        if (allUsers.length === 0) {
            return sock.sendMessage(jid, { text: '📭 Belum ada user terdaftar untuk di-broadcast.' }, { quoted: msg });
        }

        const estimatedMinutes = Math.ceil((allUsers.length * 3.2 + Math.floor(allUsers.length / 20) * 22) / 60);
        await sock.sendMessage(jid, {
            text: `📢 Memulai broadcast ke ${allUsers.length} user...\n⏱️ Estimasi waktu: ~${estimatedMinutes} menit (delay natural demi keamanan akun bot)`
        }, { quoted: msg });

        const result = await throttledBroadcast(
            sock,
            allUsers,
            () => ({ text: `📢 *BROADCAST*\n\n${actualText}\n\n_Pesan otomatis dari owner bot._` }),
            {
                onProgress: async (current, total, success, failed) => {
                    // Update progress tiap 25% supaya owner tahu proses masih jalan,
                    // tanpa spam notifikasi tiap 1 pesan
                    if (current % Math.max(Math.floor(total / 4), 1) === 0) {
                        await sock.sendMessage(jid, { text: `📊 Progress: ${current}/${total} (✅ ${success} | ❌ ${failed})` }).catch(() => {});
                    }
                }
            }
        );

        await sock.sendMessage(jid, { text: `✅ Broadcast selesai.\nBerhasil: ${result.success} | Gagal: ${result.failed}` }, { quoted: msg });
    }
};
