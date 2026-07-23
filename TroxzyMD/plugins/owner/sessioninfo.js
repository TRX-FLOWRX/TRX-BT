const fs = require('fs-extra');
const path = require('path');

module.exports = {
    command: ['sessioninfo', 'infosesi'],
    category: 'owner',
    description: 'Cek info detail sesi WhatsApp untuk membantu diagnosis masalah pairing/koneksi (owner only)',
    ownerOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid }) => {
        const sessionsPath = path.join(__dirname, '..', '..', 'sessions');
        const files = await fs.readdir(sessionsPath).catch(() => []);
        const credsExists = files.includes('creds.json');

        let text = `📡 *INFO SESI WHATSAPP*\n\n`;
        text += `Status koneksi saat ini: ${sock.user ? '✅ Terhubung' : '❌ Belum terhubung'}\n`;
        if (sock.user) {
            text += `Nomor terhubung: ${sock.user.id?.split(':')[0]}\n`;
            text += `Nama profil: ${sock.user.name || '-'}\n`;
        }
        text += `\nFile sesi ditemukan: ${files.length} file\n`;
        text += `creds.json ada: ${credsExists ? '✅ Ya' : '❌ Tidak'}\n\n`;

        text += `📝 *Jika pairing code masih gagal setelah ini:*\n`;
        text += `1. Pastikan jeda MINIMAL 1 menit antar percobaan pairing (WhatsApp membatasi percobaan beruntun)\n`;
        text += `2. Pastikan kode dimasukkan dalam 60 detik sejak muncul di layar\n`;
        text += `3. Coba hapus folder sessions/ total (bukan cuma restart) lalu jalankan ulang dari nol\n`;
        text += `4. Jika sudah gagal 5+ kali dalam 1 jam, WhatsApp kemungkinan menerapkan rate-limit sementara ke nomor itu — tunggu 1-24 jam sebelum coba lagi\n`;
        text += `5. Pastikan nomor yang didaftarkan aktif dan bisa terima SMS/panggilan verifikasi normal di WhatsApp resmi`;

        await sock.sendMessage(jid, { text }, { quoted: msg });
    }
};
