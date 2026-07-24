const { askAI } = require('../../lib/aiClient');
const config = require('../../config/config');
const userModel = require('../../lib/userModel');
const { loadSystemPrompt } = require('../../lib/promptLoader');

module.exports = {
    command: ['ai', 'chatai', 'tanya'],
    category: 'ai',
    description: 'Chat dengan AI',
    cooldown: 2,
    limitCost: 1,
    execute: async (msg, { sock, jid, text, sender }) => {
        if (!text) {
            return sock.sendMessage(jid, {
                text: `🤖 Gunakan format:\n*.ai <pertanyaan>*\n\nContoh: .ai jelaskan apa itu blackhole\n\n_Tip: ketik *.persona* untuk ubah gaya bicara AI sesuai selera kamu._`
            }, { quoted: msg });
        }

        if (!config.features.aiChat) {
            return sock.sendMessage(jid, { text: '🚫 Fitur AI Chat sedang dimatikan oleh owner.' }, { quoted: msg });
        }

        if (!config.ai.apiKey) {
            return sock.sendMessage(jid, {
                text: '❌ AI_API_KEY belum dikonfigurasi. Isi AI_API_KEY di file .env lalu restart bot.'
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '🤔', key: msg.key } });

        // Pakai persona custom user jika ada (diset lewat .persona), fallback
        // ke system prompt default yang dibaca dari file terpisah
        // (config/prompts/default_system_prompt.txt) — owner bisa edit file
        // itu langsung tanpa sentuh kode, lalu .reload untuk apply perubahan.
        const user = userModel.getUser(sender);
        let systemPrompt = user.aiPersona || loadSystemPrompt();
        if (user.activeAiPrompt) {
            systemPrompt += `\n\n${user.activeAiPrompt}`;
        }

        // maxTokens 1024 (bukan 1536/2048) — nilai lebih kecil untuk menaikkan
        // peluang GLM sukses di percobaan PERTAMA sebelum timeout 25 detik.
        // Kalau tetap timeout, aiClient.js langsung pindah ke model cadangan
        // (tanpa retry berulang di GLM sendiri) supaya user tidak menunggu lama.
        const result = await askAI(sender, text, systemPrompt, { maxTokens: 1024 });

        if (!result.success) {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(jid, { text: result.error }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });

        const fallbackNote = result.usedFallback
            ? '\n\n_(⚡ Dijawab pakai model cadangan karena model utama sedang lambat/tidak tersedia)_'
            : '';
        await sock.sendMessage(jid, { text: result.reply + fallbackNote }, { quoted: msg });
    }
};
