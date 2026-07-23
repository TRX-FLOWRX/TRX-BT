const axios = require('axios');
const config = require('../config/config');
const { translateAiError } = require('./aiClient');

/**
 * AI Vision: menganalisa gambar menggunakan format content block OpenAI
 * standar (image_url dengan data URI base64). GLM-5.2 sendiri TIDAK
 * memiliki kapabilitas vision (dikonfirmasi: text-in/text-out saja,
 * vision ada di lini terpisah GLM-V milik Z.ai). Fitur ini karena itu
 * memakai model vision lain dari katalog FreeTheAi (lihat visionModel
 * di config), bukan model GLM default bot.
 *
 * PENTING: belum ada konfirmasi resmi dari dokumentasi FreeTheAi bahwa
 * proxy mereka meneruskan kapabilitas vision model upstream secara utuh.
 * Fungsi ini menangani kegagalan dengan pesan yang jelas alih-alih
 * berasumsi selalu berhasil.
 */
async function analyzeImage(imageBuffer, prompt, mimeType = 'image/jpeg') {
    if (config.ai.visionModel === 'disabled') {
        return {
            success: false,
            error: '🚫 Fitur analisa gambar sedang tidak tersedia untuk saat ini.'
        };
    }

    try {
        const base64Image = imageBuffer.toString('base64');
        const dataUri = `data:${mimeType};base64,${base64Image}`;

        const response = await axios.post(
            `${config.ai.baseUrl}/chat/completions`,
            {
                model: config.ai.visionModel,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt || 'Deskripsikan gambar ini secara detail.' },
                            { type: 'image_url', image_url: { url: dataUri } },
                        ],
                    },
                ],
                max_tokens: 1024,
            },
            {
                headers: {
                    'Authorization': `Bearer ${config.ai.apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 45000,
            }
        );

        const reply = response.data?.choices?.[0]?.message?.content?.trim();
        if (!reply) throw new Error('Respon AI vision kosong.');

        return { success: true, reply };
    } catch (err) {
        const translated = translateAiError(err);
        console.error('[VISION ERROR]', translated.logDetail);

        // Tambahan konteks khusus vision: kalau error-nya generic 400,
        // kemungkinan besar model/proxy tidak benar-benar support format image_url.
        // Pesan ke user tetap generik (tidak sebut nama model/provider); detail
        // teknis untuk owner ada di console log lewat logDetail di atas.
        const isLikelyUnsupported = err.response?.status === 400 && !err.response?.data?.error?.type;
        if (isLikelyUnsupported) {
            console.error('[VISION HINT] Kemungkinan model/proxy tidak mendukung format image_url. Cek AI_VISION_MODEL di .env.');
        }

        return { success: false, error: translated.userMessage };
    }
}

module.exports = { analyzeImage };
