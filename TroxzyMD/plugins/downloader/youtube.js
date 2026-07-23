const { downloadYouTube } = require('../../lib/downloader');

module.exports = {
    command: ['youtube', 'yt', 'ytdl', 'ytmp4', 'ytmp3'],
    category: 'downloader',
    description: 'Download video/audio YouTube',
    cooldown: 5,
    limitCost: 2,
    premium: false,
    execute: async (msg, { sock, jid, text, command }) => {
        if (!text || (!text.includes('youtube.com') && !text.includes('youtu.be'))) {
            return sock.sendMessage(jid, {
                text: '📥 Kirim link YouTube yang valid.\nContoh: *.ytmp4 https://youtu.be/xxxxx*\natau *.ytmp3 https://youtu.be/xxxxx* untuk audio saja'
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        const result = await downloadYouTube(text.trim());

        if (!result.success) {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(jid, { text: `❌ Gagal download.\nDetail: ${result.error}` }, { quoted: msg });
        }

        const wantAudio = command === 'ytmp3';
        const format = result.formats?.find(f => wantAudio ? f.type === 'audio' : f.type === 'video');

        if (!format) {
            return sock.sendMessage(jid, { text: '❌ Format yang diminta tidak tersedia untuk video ini.' }, { quoted: msg });
        }

        if (wantAudio) {
            await sock.sendMessage(jid, {
                audio: { url: format.url },
                mimetype: 'audio/mpeg',
                fileName: `${result.title}.mp3`,
            }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, {
                video: { url: format.url },
                caption: `🎬 *${result.title}*\n⏱️ Durasi: ${result.duration || '-'}`
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
    }
};
