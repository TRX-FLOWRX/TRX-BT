const { downloadPinterest } = require('../../lib/downloader');

module.exports = {
    command: ['pinterest', 'pin', 'pindl'],
    category: 'downloader',
    description: 'Download gambar/video dari Pinterest',
    cooldown: 3,
    limitCost: 1,
    execute: async (msg, { sock, jid, text }) => {
        if (!text || !text.includes('pinterest.com') && !text.includes('pin.it')) {
            return sock.sendMessage(jid, { text: '📥 Kirim link Pinterest yang valid.\nContoh: *.pinterest https://pin.it/xxxxx*' }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });
        const result = await downloadPinterest(text.trim());

        if (!result.success) {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(jid, { text: `❌ Gagal download.\nDetail: ${result.error}` }, { quoted: msg });
        }

        for (const item of result.media) {
            if (item.type === 'video') {
                await sock.sendMessage(jid, { video: { url: item.url }, caption: result.title || '' }, { quoted: msg });
            } else {
                await sock.sendMessage(jid, { image: { url: item.url }, caption: result.title || '' }, { quoted: msg });
            }
        }
        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
    }
};
