const { askAI } = require('../../lib/aiClient');
const config = require('../../config/config');
const userModel = require('../../lib/userModel');
const { loadSystemPrompt } = require('../../lib/promptLoader');

module.exports = {
    command: ['brainstorm', 'futureplan', 'ideafuture'],
    category: 'ai',
    description: 'Membantu kamu membuat ide masa depan, roadmap, atau strategi bisnis/produk.',
    cooldown: 5,
    limitCost: 1,
    execute: async (msg, { sock, jid, text, sender }) => {
        if (!text) {
            return sock.sendMessage(jid, {
                text: `🤖 Gunakan format:\n*.brainstorm <topik/tujuan>*\n\nContoh: .brainstorm ide fitur bot WA masa depan atau .brainstorm rencana bisnis aplikasi NFT` 
            }, { quoted: msg });
        }

        if (!config.ai.apiKey) {
            return sock.sendMessage(jid, {
                text: '❌ AI_API_KEY belum dikonfigurasi. Isi AI_API_KEY di file .env lalu restart bot.'
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '🤖', key: msg.key } });
        const user = userModel.getUser(sender);
        let systemPrompt = loadSystemPrompt();
        if (user.activeAiPrompt) {
            systemPrompt += `\n\n${user.activeAiPrompt}`;
        }
        systemPrompt += `\n\nKamu adalah asisten futuristik yang membantu menghasilkan ide inovatif, roadmap produk, dan strategi yang terdengar modern, scalable, dan dapat dijalankan.`;

        const prompting = `Buat 3-5 ide atau strategi yang inovatif terkait: ${text}. Tulis dengan format poin ringkas dan sertakan saran langkah awal.`;
        const result = await askAI(sender, prompting, systemPrompt, { maxTokens: 1024 });

        if (!result.success) {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(jid, { text: result.error }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        const fallbackNote = result.usedFallback
            ? '\n\n_(⚡ Jawaban ini dibuat dari model cadangan karena model utama sedang sibuk atau tidak tersedia.)_'
            : '';
        await sock.sendMessage(jid, { text: result.reply + fallbackNote }, { quoted: msg });
    }
};