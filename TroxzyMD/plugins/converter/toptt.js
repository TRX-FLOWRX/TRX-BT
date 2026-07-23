const { downloadContentFromMessage } = require('../../lib/baileysHelper');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs-extra');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

module.exports = {
    command: ['toptt', 'tovn'],
    category: 'converter',
    description: 'Ubah audio menjadi voice note (PTT)',
    cooldown: 5,
    limitCost: 1,
    execute: async (msg, { sock, jid }) => {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const audioMsg = quoted?.audioMessage;

        if (!audioMsg) {
            return sock.sendMessage(jid, { text: '🎵 Reply audio dengan caption *.toptt*' }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        const tmpDir = path.join(__dirname, '..', '..', 'tmp');
        await fs.ensureDir(tmpDir);
        const inputPath = path.join(tmpDir, `in_${Date.now()}.ogg`);
        const outputPath = path.join(tmpDir, `out_${Date.now()}.ogg`);

        try {
            const stream = await downloadContentFromMessage(audioMsg, 'audio');
            const buffer = await streamToBuffer(stream);
            await fs.writeFile(inputPath, buffer);

            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .audioCodec('libopus')
                    .audioBitrate('32k')
                    .toFormat('ogg')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(outputPath);
            });

            const outputBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(jid, { audio: outputBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, { text: `❌ Gagal konversi. Detail: ${err.message}` }, { quoted: msg });
        } finally {
            await fs.remove(inputPath).catch(() => {});
            await fs.remove(outputPath).catch(() => {});
        }
    }
};
