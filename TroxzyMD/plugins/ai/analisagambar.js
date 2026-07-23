const { downloadContentFromMessage } = require('../../lib/baileysHelper');
const { analyzeImage } = require('../../lib/visionClient');

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

module.exports = {
    command: ['analisagambar', 'tanyagambar', 'seeimg'],
    category: 'ai',
    description: 'Analisa/deskripsikan gambar menggunakan AI vision (reply gambar)',
    cooldown: 5,
    limitCost: 2,
    execute: async (msg, { sock, jid, text }) => {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMsg = quoted?.imageMessage || msg.message?.imageMessage;

        if (!imageMsg) {
            return sock.sendMessage(jid, {
                text: '🖼️ Kirim/reply gambar dengan caption *.analisagambar <pertanyaan opsional>*\n\nContoh:\n.analisagambar (tanpa teks = deskripsi umum)\n.analisagambar ini gambar apa dan ada berapa orang?'
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '👀', key: msg.key } });

        try {
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            const buffer = await streamToBuffer(stream);

            const result = await analyzeImage(buffer, text, imageMsg.mimetype || 'image/jpeg');

            if (!result.success) {
                await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
                return sock.sendMessage(jid, { text: result.error }, { quoted: msg });
            }

            await sock.sendMessage(jid, { text: `👁️ *Hasil Analisa:*\n\n${result.reply}` }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('[ANALISAGAMBAR ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, { text: '❌ Gagal memproses gambar. Coba lagi atau gunakan gambar lain.' }, { quoted: msg });
        }
    }
};
