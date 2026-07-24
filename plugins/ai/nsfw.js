const { askAI } = require('../../lib/aiClient');
const config = require('../../config/config');
const userModel = require('../../lib/userModel');
const { loadSystemPrompt } = require('../../lib/promptLoader');

module.exports = {
    command: ['nsfw', 'adult', 'dewasa'],
    category: 'ai',
    description: 'Fitur 18+ untuk konten dewasa berkaitan dengan teks (hanya user 18+ dan grup NSFW).',
    cooldown: 10,
    limitCost: 2,
    requiresAgeVerified: true,
    execute: async (msg, { sock, jid, text, sender, isGroup }) => {
        if (!text) {
            return sock.sendMessage(jid, {
                text: '🔞 Format: *.nsfw <permintaan teks dewasa>*\nContoh: .nsfw buat cerita romantis dewasa dengan nuansa cyberpunk'
            }, { quoted: msg });
        }

        if (isGroup) {
            const groupModel = require('../../lib/groupModel');
            const group = groupModel.getGroup(jid);
            if (!group.nsfw) {
                return sock.sendMessage(jid, { text: '⚠️ Fitur NSFW hanya boleh digunakan di grup yang telah diaktifkan NSFW oleh admin.' }, { quoted: msg });
            }
        }

        if (!config.features.aiChat) {
            return sock.sendMessage(jid, { text: '🚫 Fitur AI Chat sedang dimatikan oleh owner.' }, { quoted: msg });
        }

        const urlMatch = text.trim().match(/^(?:image|video|url)\s+(.+)$/i);
        const directLink = urlMatch ? urlMatch[1].trim() : text.trim();

        const supportedImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const supportedVideoExtensions = ['.mp4', '.mov', '.webm', '.mkv', '.avi'];

        function getMediaTypeFromUrl(link) {
            try {
                const url = new URL(link);
                const pathname = url.pathname.toLowerCase();
                for (const ext of supportedImageExtensions) {
                    if (pathname.endsWith(ext)) return 'image';
                }
                for (const ext of supportedVideoExtensions) {
                    if (pathname.endsWith(ext)) return 'video';
                }
                return null;
            } catch {
                return null;
            }
        }

        async function sendMediaByLink(link) {
            const mediaType = getMediaTypeFromUrl(link);
            if (!mediaType) {
                return sock.sendMessage(jid, { text: '⚠️ Link tidak dikenali sebagai gambar atau video. Pastikan berakhiran .jpg/.png/.mp4/.webm, atau gunakan teks untuk konten generatif.' }, { quoted: msg });
            }

            const payload = mediaType === 'image'
                ? { image: { url: link }, caption: '_Konten NSFW dikirim sesuai link yang disediakan._' }
                : { video: { url: link }, caption: '_Konten NSFW dikirim sesuai link yang disediakan._' };

            await sock.sendMessage(jid, payload, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
            return true;
        }

        const maybeMediaUrl = text.trim();
        if (getMediaTypeFromUrl(maybeMediaUrl)) {
            if (!config.ai.apiKey) {
                return sock.sendMessage(jid, { text: '❌ AI_API_KEY belum dikonfirmasi, namun link media tetap bisa dikirim tanpa AI.' }, { quoted: msg });
            }
            return sendMediaByLink(maybeMediaUrl);
        }

        if (!config.ai.apiKey) {
            return sock.sendMessage(jid, { text: '❌ AI_API_KEY belum dikonfigurasi. Isi AI_API_KEY di file .env lalu restart bot.' }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '🔞', key: msg.key } });

        const user = userModel.getUser(sender);
        let systemPrompt = user.aiPersona || loadSystemPrompt();
        if (user.activeAiPrompt) {
            systemPrompt += `\n\n${user.activeAiPrompt}`;
        }
        systemPrompt += '\n\nKamu adalah asisten AI yang memberikan konten teks dewasa secara bertanggung jawab sesuai permintaan, hanya jika permintaan tidak melanggar hukum atau kebijakan platform, dan dijawab dalam gaya yang diinginkan user.';

        const prompt = `Buat teks dewasa untuk permintaan berikut: ${text}`;
        const result = await askAI(sender, prompt, systemPrompt, { maxTokens: 1024 });

        if (!result.success) {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(jid, { text: result.error }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        await sock.sendMessage(jid, { text: result.reply }, { quoted: msg });
    }
};