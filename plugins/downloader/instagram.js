const { downloadInstagram } = require('../../lib/downloader');

module.exports = {
    command: ['instagram', 'ig', 'igdl'],
    category: 'downloader',
    description: 'Download foto/video Instagram (post, reels)',
    cooldown: 3,
    limitCost: 1,
    execute: async (msg, { sock, jid, text }) => {
        if (!text || !text.includes('instagram.com')) {
            return sock.sendMessage(jid, {
                text: '📥 Kirim link Instagram yang valid.\nContoh: *.ig https://www.instagram.com/p/xxxxx*'
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        const result = await downloadInstagram(text.trim());

        if (!result.success) {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(jid, { text: `❌ Gagal download.\nDetail: ${result.error}` }, { quoted: msg });
        }

        for (const item of result.media) {
            if (item.type === 'video') {
                await sock.sendMessage(jid, { video: { url: item.url } }, { quoted: msg });
            } else {
                await sock.sendMessage(jid, { image: { url: item.url } }, { quoted: msg });
            }
        }

        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
    }
};
