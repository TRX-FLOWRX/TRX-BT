const axios = require('axios');

module.exports = {
    command: ['qrcode', 'buatqr', 'toqr'],
    category: 'tools',
    description: 'Membuat QR code dari teks atau link',
    cooldown: 3,
    limitCost: 1,
    execute: async (msg, { sock, jid, text }) => {
        if (!text) {
            return sock.sendMessage(jid, { text: '📝 Format: *.qrcode <teks/link>*\nContoh: .qrcode https://wa.me/6281234567890' }, { quoted: msg });
        }

        try {
            // Menggunakan QuickChart QR generator - gratis, tanpa API key, banyak dipakai di ekosistem bot
            const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(text)}&size=400`;
            const response = await axios.get(qrUrl, { responseType: 'arraybuffer', timeout: 15000 });

            await sock.sendMessage(jid, {
                image: Buffer.from(response.data),
                caption: `✅ QR Code untuk:\n"${text.length > 100 ? text.slice(0, 100) + '...' : text}"`
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Gagal membuat QR code.\nDetail: ${err.message}` }, { quoted: msg });
        }
    }
};
