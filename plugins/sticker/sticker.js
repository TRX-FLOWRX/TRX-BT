const { downloadContentFromMessage } = require('../../lib/baileysHelper');
const { imageToWebpSticker, videoToWebpSticker } = require('../../lib/stickerMaker');
const config = require('../../config/config');

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

module.exports = {
    command: ['sticker', 's', 'stiker'],
    category: 'sticker',
    description: 'Ubah gambar/video/gif menjadi stiker',
    cooldown: 3,
    limitCost: 1,
    execute: async (msg, { sock, jid, args }) => {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const targetMsg = quoted || msg.message;

        const imageMsg = targetMsg?.imageMessage;
        const videoMsg = targetMsg?.videoMessage;

        if (!imageMsg && !videoMsg) {
            return sock.sendMessage(jid, {
                text: '🖼️ Kirim/reply gambar atau video pendek (maks 6 detik) dengan caption *.sticker*\n\nOpsi tambahan:\n*.sticker packname|author* untuk custom nama'
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        try {
            const [packname, author] = args.join(' ').split('|').map(s => s.trim());
            const options = { pack: packname || config.botName, author: author || config.ownerName };

            let stickerBuffer;
            if (imageMsg) {
                const stream = await downloadContentFromMessage(imageMsg, 'image');
                const buffer = await streamToBuffer(stream);
                stickerBuffer = await imageToWebpSticker(buffer, options);
            } else {
                const stream = await downloadContentFromMessage(videoMsg, 'video');
                const buffer = await streamToBuffer(stream);
                stickerBuffer = await videoToWebpSticker(buffer, options);
            }

            await sock.sendMessage(jid, { sticker: stickerBuffer }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('[STICKER ERROR]', err);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, { text: `❌ Gagal membuat stiker.\nDetail: ${err.message}` }, { quoted: msg });
        }
    }
};
