const math = require('mathjs');

module.exports = {
    command: ['calc', 'kalkulator', 'hitung'],
    category: 'tools',
    description: 'Kalkulator matematika',
    limitCost: 0,
    execute: async (msg, { sock, jid, text }) => {
        if (!text) {
            return sock.sendMessage(jid, { text: '📝 Format: *.calc <ekspresi>*\nContoh: .calc (5+3)*2/4' }, { quoted: msg });
        }

        try {
            const result = math.evaluate(text);
            await sock.sendMessage(jid, { text: `🧮 *${text}* = *${result}*` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Ekspresi tidak valid.\nDetail: ${err.message}` }, { quoted: msg });
        }
    }
};
