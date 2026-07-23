const axios = require('axios');

module.exports = {
    command: ['quotes', 'motivasi'],
    category: 'fun',
    description: 'Menampilkan quotes motivasi random',
    cooldown: 2,
    limitCost: 0,
    execute: async (msg, { sock, jid }) => {
        try {
            const { data } = await axios.get('https://api.quotable.io/random', { timeout: 10000 });
            await sock.sendMessage(jid, {
                text: `💭 _"${data.content}"_\n\n— *${data.author}*`
            }, { quoted: msg });
        } catch (err) {
            // Fallback quotes lokal jika API down
            const fallbackQuotes = [
                { text: 'Kesuksesan adalah hasil dari persiapan yang bertemu kesempatan.', author: 'Anonymous' },
                { text: 'Jangan menunggu kesempatan, ciptakan kesempatan itu sendiri.', author: 'Anonymous' },
                { text: 'Kegagalan hanyalah kesempatan untuk memulai lagi dengan lebih cerdas.', author: 'Henry Ford' },
            ];
            const random = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
            await sock.sendMessage(jid, { text: `💭 _"${random.text}"_\n\n— *${random.author}*` }, { quoted: msg });
        }
    }
};
