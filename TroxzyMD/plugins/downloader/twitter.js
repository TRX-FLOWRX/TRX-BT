const { downloadTwitter } = require('../../lib/downloader');

module.exports = {
    command: ['twitter', 'x', 'xdl', 'twdl'],
    category: 'downloader',
    description: 'Download video/gambar dari Twitter (X)',
    cooldown: 3,
    limitCost: 1,
    execute: async (msg, { sock, jid, text }) => {
        if (!text || (!text.includes('twitter.com') && !text.includes('x.com'))) {
            return sock.sendMessage(jid, { text: '📥 Kirim link Twitter/X yang valid.\nContoh: *.x https://x.com/user/status/xxxxx*' }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });
        const result = await downloadTwitter(text.trim());

        if (!result.success) {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(jid, { text: `❌ Gagal download.\nDetail: ${result.error}` }, { quoted: msg });
        }

        for (const item of result.media) {
            if (item.includes('.mp4')) {
                await sock.sendMessage(jid, { video: { url: item }, caption: result.text || '' }, { quoted: msg });
            } else {
                await sock.sendMessage(jid, { image: { url: item }, caption: result.text || '' }, { quoted: msg });
            }
        }
        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
    }
};
