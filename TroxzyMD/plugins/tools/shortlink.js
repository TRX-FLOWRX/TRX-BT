const axios = require('axios');

module.exports = {
    command: ['shortlink', 'pendekin', 'tinyurl'],
    category: 'tools',
    description: 'Memperpendek URL panjang',
    cooldown: 3,
    limitCost: 1,
    execute: async (msg, { sock, jid, text }) => {
        if (!text || !text.startsWith('http')) {
            return sock.sendMessage(jid, { text: '📝 Format: *.shortlink <url>*\nContoh: .shortlink https://contoh.com/link-yang-sangat-panjang-sekali' }, { quoted: msg });
        }

        try {
            // TinyURL - gratis, tanpa API key, tidak butuh registrasi
            const response = await axios.get('https://tinyurl.com/api-create.php', {
                params: { url: text.trim() },
                timeout: 15000,
            });

            await sock.sendMessage(jid, { text: `✅ Link pendek:\n${response.data}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Gagal memperpendek link.\nDetail: ${err.message}` }, { quoted: msg });
        }
    }
};
