const { downloadFacebook } = require('../../lib/downloader');

module.exports = {
    command: ['facebook', 'fb', 'fbdl'],
    category: 'downloader',
    description: 'Download video Facebook',
    cooldown: 3,
    limitCost: 1,
    execute: async (msg, { sock, jid, text }) => {
        if (!text || !text.includes('facebook.com')) {
            return sock.sendMessage(jid, { text: '📥 Kirim link Facebook yang valid.\nContoh: *.fb https://facebook.com/xxxxx*' }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });
        const result = await downloadFacebook(text.trim());

        if (!result.success) {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(jid, { text: `❌ Gagal download.\nDetail: ${result.error}` }, { quoted: msg });
        }

        await sock.sendMessage(jid, {
            video: { url: result.hd || result.sd },
            caption: `🎬 *${result.title || 'Facebook Video'}*`
        }, { quoted: msg });
        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
    }
};
