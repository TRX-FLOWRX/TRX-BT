const { downloadTikTok } = require('../../lib/downloader');

module.exports = {
    command: ['tiktok', 'tt', 'ttdl'],
    category: 'downloader',
    description: 'Download video TikTok tanpa watermark',
    cooldown: 3,
    limitCost: 1,
    execute: async (msg, { sock, jid, text }) => {
        if (!text || !text.includes('tiktok.com')) {
            return sock.sendMessage(jid, {
                text: '📥 Kirim link TikTok yang valid.\nContoh: *.tiktok https://vt.tiktok.com/xxxxx*'
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        const result = await downloadTikTok(text.trim());

        if (!result.success) {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(jid, { text: `❌ Gagal download.\nDetail: ${result.error}` }, { quoted: msg });
        }

        await sock.sendMessage(jid, {
            video: { url: result.noWatermark },
            caption: `🎵 *${result.title || 'TikTok Video'}*\n👤 Author: ${result.author || '-'}\n\n_Downloaded via ${require('../../config/config').botName}_`
        }, { quoted: msg });

        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
    }
};
