const axios = require('axios');
const { imageToWebpSticker } = require('../../lib/stickerMaker');
const config = require('../../config/config');

module.exports = {
    command: ['stickerlink', 'slink'],
    category: 'sticker',
    description: 'Membuat stiker langsung dari link gambar',
    cooldown: 3,
    limitCost: 1,
    execute: async (msg, { sock, jid, text }) => {
        if (!text || !text.startsWith('http')) {
            return sock.sendMessage(jid, { text: '🔗 Format: *.stickerlink <link_gambar>*' }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        try {
            const response = await axios.get(text.trim(), { responseType: 'arraybuffer', timeout: 20000 });
            const buffer = Buffer.from(response.data);

            const stickerBuffer = await imageToWebpSticker(buffer, { pack: config.botName, author: config.ownerName });

            await sock.sendMessage(jid, { sticker: stickerBuffer }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, { text: `❌ Gagal membuat stiker dari link.\nDetail: ${err.message}` }, { quoted: msg });
        }
    }
};
