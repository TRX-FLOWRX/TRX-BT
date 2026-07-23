const { downloadContentFromMessage } = require('../../lib/baileysHelper');
const axios = require('axios');
const FormData = require('form-data');

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

module.exports = {
    command: ['tourl', 'upload'],
    category: 'converter',
    description: 'Upload media menjadi link URL (via catbox.moe)',
    cooldown: 5,
    limitCost: 1,
    execute: async (msg, { sock, jid }) => {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const targetMsg = quoted || msg.message;
        const mediaMsg = targetMsg?.imageMessage || targetMsg?.videoMessage;

        if (!mediaMsg) {
            return sock.sendMessage(jid, { text: '📎 Kirim/reply gambar atau video dengan caption *.tourl*' }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        try {
            const type = targetMsg.imageMessage ? 'image' : 'video';
            const stream = await downloadContentFromMessage(mediaMsg, type);
            const buffer = await streamToBuffer(stream);

            const form = new FormData();
            form.append('reqtype', 'fileupload');
            form.append('fileToUpload', buffer, { filename: `file.${type === 'image' ? 'jpg' : 'mp4'}` });

            const response = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: form.getHeaders(),
                timeout: 30000,
            });

            await sock.sendMessage(jid, { text: `✅ Link berhasil dibuat:\n${response.data}` }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, { text: `❌ Gagal upload. Detail: ${err.message}` }, { quoted: msg });
        }
    }
};
