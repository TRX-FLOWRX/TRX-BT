const axios = require('axios');
const { askAI } = require('../../lib/aiClient');

const SUMMARIZE_PROMPT = `Kamu adalah asisten peringkas artikel. Ringkas konten yang diberikan dalam 3-5 poin utama memakai bahasa Indonesia yang jelas dan padat. Fokus pada fakta dan poin penting, hilangkan basa-basi/iklan/navigasi halaman. Jika kontennya bukan artikel yang valid (misal halaman error atau kosong), katakan itu terus terang alih-alih mengarang ringkasan.`;

function stripHtml(html) {
    // Pembersihan HTML sederhana: hapus script/style, tag, dan rapikan whitespace
    return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
}

module.exports = {
    command: ['ringkas', 'summarize', 'ringkasartikel'],
    category: 'ai',
    description: 'Meringkas artikel/berita dari URL menggunakan AI',
    cooldown: 8,
    limitCost: 2,
    execute: async (msg, { sock, jid, text, sender }) => {
        if (!text || !text.startsWith('http')) {
            return sock.sendMessage(jid, {
                text: '📰 Format: *.ringkas <url artikel>*\nContoh: .ringkas https://contoh-berita.com/artikel-123'
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '📖', key: msg.key } });

        try {
            const response = await axios.get(text.trim(), {
                timeout: 15000,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TroxzyMD-Bot/1.0)' },
                maxContentLength: 5 * 1024 * 1024, // maks 5MB, hindari halaman raksasa
            });

            const cleanText = stripHtml(response.data).slice(0, 12000); // batasi supaya hemat token

            if (cleanText.length < 100) {
                await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
                return sock.sendMessage(jid, { text: '❌ Konten halaman terlalu sedikit atau tidak bisa dibaca (mungkin butuh JavaScript/login).' }, { quoted: msg });
            }

            const result = await askAI(`ringkas_${sender}`, cleanText, SUMMARIZE_PROMPT, { skipHistory: true, maxTokens: 1024 });

            if (!result.success) {
                await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
                return sock.sendMessage(jid, { text: result.error }, { quoted: msg });
            }

            await sock.sendMessage(jid, { text: `📰 *Ringkasan Artikel:*\n\n${result.reply}` }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('[RINGKAS ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            const errMsg = err.code === 'ECONNABORTED' ? 'Halaman terlalu lama merespon (timeout).' : 'Gagal mengambil konten dari URL tersebut. Pastikan link valid dan bisa diakses publik.';
            await sock.sendMessage(jid, { text: `❌ ${errMsg}` }, { quoted: msg });
        }
    }
};
