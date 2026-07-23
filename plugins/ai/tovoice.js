const { downloadContentFromMessage } = require('../../lib/baileysHelper');
const { speechToText } = require('../../lib/sttClient');

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

module.exports = {
    command: ['tovoice', 'transkrip', 'speechtotext'],
    category: 'ai',
    description: 'Transkrip voice note menjadi teks (reply voice note)',
    cooldown: 5,
    limitCost: 2,
    execute: async (msg, { sock, jid }) => {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const audioMsg = quoted?.audioMessage;

        if (!audioMsg) {
            return sock.sendMessage(jid, { text: '🎙️ Reply voice note dengan caption *.tovoice* untuk transkrip jadi teks.' }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        try {
            const stream = await downloadContentFromMessage(audioMsg, 'audio');
            const buffer = await streamToBuffer(stream);

            const result = await speechToText(buffer);

            if (!result.success) {
                await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
                return sock.sendMessage(jid, { text: result.error }, { quoted: msg });
            }

            await sock.sendMessage(jid, { text: `📝 *Transkrip:*\n\n${result.transcript}` }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('[TOVOICE ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, { text: '❌ Gagal memproses voice note. Coba lagi atau kirim ulang voice note-nya.' }, { quoted: msg });
        }
    }
};
