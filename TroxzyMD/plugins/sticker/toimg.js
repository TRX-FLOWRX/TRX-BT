const { downloadContentFromMessage } = require('../../lib/baileysHelper');
let sharp;
try {
    sharp = require('sharp');
} catch (err) {
    sharp = null;
}

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

module.exports = {
    command: ['toimg', 'toimage'],
    category: 'sticker',
    description: 'Ubah stiker menjadi gambar',
    cooldown: 3,
    limitCost: 1,
    execute: async (msg, { sock, jid }) => {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const stickerMsg = quoted?.stickerMessage;

        if (!stickerMsg) {
            return sock.sendMessage(jid, { text: '🖼️ Reply stiker dengan caption *.toimg*' }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        if (!sharp) {
            return sock.sendMessage(jid, { text: '❌ Plugin ini membutuhkan modul sharp yang belum tersedia di lingkungan runtime.' }, { quoted: msg });
        }

        try {
            const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
            const buffer = await streamToBuffer(stream);
            const imageBuffer = await sharp(buffer).png().toBuffer();

            await sock.sendMessage(jid, { image: imageBuffer }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, { text: `❌ Gagal: ${err.message}` }, { quoted: msg });
        }
    }
};
