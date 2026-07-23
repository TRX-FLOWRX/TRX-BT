const { textToSpeech } = require('../../lib/ttsClient');

module.exports = {
    command: ['tts', 'texttospeech', 'ngomong'],
    category: 'ai',
    description: 'Ubah teks menjadi suara (voice note AI)',
    cooldown: 5,
    limitCost: 2,
    execute: async (msg, { sock, jid, text }) => {
        if (!text) {
            return sock.sendMessage(jid, {
                text: '🔊 Format: *.tts <teks>*\nContoh: .tts Halo, apa kabar hari ini?'
            }, { quoted: msg });
        }

        if (text.length > 500) {
            return sock.sendMessage(jid, { text: '⚠️ Teks terlalu panjang (maks 500 karakter untuk sekali proses).' }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '🔊', key: msg.key } });

        const result = await textToSpeech(text);

        if (!result.success) {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(jid, { text: result.error }, { quoted: msg });
        }

        await sock.sendMessage(jid, {
            audio: result.audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: true,
        }, { quoted: msg });

        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
    }
};
