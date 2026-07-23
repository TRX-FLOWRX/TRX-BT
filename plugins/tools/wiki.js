const axios = require('axios');

module.exports = {
    command: ['wiki', 'wikipedia'],
    category: 'tools',
    description: 'Mencari informasi dari Wikipedia',
    cooldown: 3,
    limitCost: 1,
    execute: async (msg, { sock, jid, text }) => {
        if (!text) {
            return sock.sendMessage(jid, { text: '📝 Format: *.wiki <kata kunci>*\nContoh: .wiki Albert Einstein' }, { quoted: msg });
        }

        try {
            const { data } = await axios.get('https://id.wikipedia.org/w/api.php', {
                params: {
                    action: 'query',
                    format: 'json',
                    prop: 'extracts',
                    exintro: true,
                    explaintext: true,
                    titles: text,
                    redirects: 1,
                },
                timeout: 15000,
            });

            const pages = data.query.pages;
            const page = Object.values(pages)[0];

            if (!page || page.missing !== undefined) {
                return sock.sendMessage(jid, { text: `❌ Tidak ditemukan artikel untuk "${text}"` }, { quoted: msg });
            }

            const extract = page.extract.slice(0, 1500);
            await sock.sendMessage(jid, {
                text: `📖 *${page.title}*\n\n${extract}${page.extract.length > 1500 ? '...' : ''}\n\n_Sumber: Wikipedia_`
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Gagal mencari. Detail: ${err.message}` }, { quoted: msg });
        }
    }
};
