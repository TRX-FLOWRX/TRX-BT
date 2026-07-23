const { askAI } = require('../../lib/aiClient');

module.exports = {
    command: ['paraphrase', 'para'],
    category: 'ai',
    description: 'Parafrase teks kamu menjadi bahasa Indonesia yang lebih natural.',
    cooldown: 5,
    limitCost: 1,
    execute: async (msg, { sock, args, text, jid }) => {
        const inputText = text.trim() || args.join(' ');
        if (!inputText) {
            return sock.sendMessage(jid, { text: '📝 Gunakan: *.paraphrase <teks>*' }, { quoted: msg });
        }

        const systemPrompt = 'Kamu adalah asisten yang memparafrase teks bahasa Indonesia secara natural tanpa mengubah makna.';
        const result = await askAI(jid, inputText, systemPrompt, { maxTokens: 512 });

        if (!result.success) {
            return sock.sendMessage(jid, { text: result.error || '❌ Gagal memparafrase teks saat ini. Coba lagi nanti.' }, { quoted: msg });
        }

        await sock.sendMessage(jid, { text: `🌀 Hasil parafrase:\n${result.reply}` }, { quoted: msg });
    }
};
