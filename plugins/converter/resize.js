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
    command: ['resize', 'compress'],
    category: 'converter',
    description: 'Resize atau kompres ukuran gambar',
    cooldown: 3,
    limitCost: 1,
    execute: async (msg, { sock, jid, args }) => {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMsg = quoted?.imageMessage || msg.message?.imageMessage;

        if (!imageMsg) {
            return sock.sendMessage(jid, {
                text: '🖼️ Kirim/reply gambar dengan caption *.resize <lebar>x<tinggi>*\nContoh: .resize 512x512\n\nAtau *.compress* untuk kompresi otomatis'
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        if (!sharp) {
            return sock.sendMessage(jid, { text: '❌ Plugin ini membutuhkan modul sharp yang belum tersedia di lingkungan runtime.' }, { quoted: msg });
        }

        try {
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            const buffer = await streamToBuffer(stream);

            let sharpInstance = sharp(buffer);

            const dimensionArg = args[0];
            if (dimensionArg && dimensionArg.includes('x')) {
                const [width, height] = dimensionArg.split('x').map(Number);
                sharpInstance = sharpInstance.resize(width, height);
            }

            const outputBuffer = await sharpInstance.jpeg({ quality: 70 }).toBuffer();

            await sock.sendMessage(jid, {
                image: outputBuffer,
                caption: `✅ Berhasil diproses.\nUkuran baru: ${(outputBuffer.length / 1024).toFixed(1)} KB`
            }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, { text: `❌ Gagal memproses. Detail: ${err.message}` }, { quoted: msg });
        }
    }
};
