const axios = require('axios');

module.exports = {
    command: ['tr', 'translate'],
    category: 'tools',
    description: 'Menerjemahkan teks ke bahasa lain',
    cooldown: 2,
    limitCost: 1,
    execute: async (msg, { sock, jid, args, text }) => {
        if (args.length < 2) {
            return sock.sendMessage(jid, {
                text: '📝 Format: *.tr <kode_bahasa> <teks>*\nContoh: .tr en Selamat pagi\n\nKode umum: id, en, ja, ko, ar, es, fr'
            }, { quoted: msg });
        }

        const targetLang = args[0];
        const sourceText = args.slice(1).join(' ');

        try {
            const { data } = await axios.get('https://translate.googleapis.com/translate_a/single', {
                params: {
                    client: 'gtx',
                    sl: 'auto',
                    tl: targetLang,
                    dt: 't',
                    q: sourceText,
                },
                timeout: 15000,
            });

            const translated = data[0].map(item => item[0]).join('');
            await sock.sendMessage(jid, { text: `🌐 *Hasil Terjemahan (${targetLang})*\n\n${translated}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Gagal menerjemahkan. Detail: ${err.message}` }, { quoted: msg });
        }
    }
};
