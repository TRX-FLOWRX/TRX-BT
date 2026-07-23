const axios = require('axios');
const config = require('../config/config');
const { translateAiError } = require('./aiClient');

/**
 * Image generation via endpoint resmi FreeTheAi: POST /v1/images/generations
 * Beberapa model EVE bersifat async — jika response mengembalikan request_id
 * tanpa url langsung, kita polling GET /v1/images/generations/{request_id}
 * sampai selesai. Referensi: https://freetheai.xyz/docs#endpoints
 */
async function generateImage(prompt, { size = '1024x1024' } = {}) {
    try {
        const response = await axios.post(
            `${config.ai.baseUrl}/images/generations`,
            {
                model: config.ai.imageModel,
                prompt,
                n: 1,
                size,
            },
            {
                headers: {
                    'Authorization': `Bearer ${config.ai.apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 45000,
            }
        );

        // Kasus sinkron: hasil gambar langsung tersedia
        const directUrl = response.data?.data?.[0]?.url;
        const directB64 = response.data?.data?.[0]?.b64_json;
        if (directUrl || directB64) {
            return { success: true, url: directUrl, base64: directB64 };
        }

        // Kasus async: perlu polling request_id
        const requestId = response.data?.request_id || response.data?.id;
        if (requestId) {
            return await pollImageResult(requestId);
        }

        throw new Error('Response tidak mengandung gambar atau request_id.');
    } catch (err) {
        const translated = translateAiError(err);
        console.error('[IMAGE GEN ERROR]', translated.logDetail);
        return { success: false, error: translated.userMessage };
    }
}

async function pollImageResult(requestId, maxAttempts = 15, intervalMs = 4000) {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, intervalMs));

        try {
            const response = await axios.get(
                `${config.ai.baseUrl}/images/generations/${requestId}`,
                {
                    headers: { 'Authorization': `Bearer ${config.ai.apiKey}` },
                    timeout: 15000,
                }
            );

            const status = response.data?.status;
            const url = response.data?.data?.[0]?.url;
            const base64 = response.data?.data?.[0]?.b64_json;

            if (url || base64) {
                return { success: true, url, base64 };
            }
            if (status === 'failed' || status === 'error') {
                return { success: false, error: '❌ Proses generate gambar gagal di sisi provider.' };
            }
            // status masih "processing"/"pending" -> lanjut polling
        } catch (err) {
            // Kalau gagal fetch status, coba lagi di iterasi berikutnya
            continue;
        }
    }

    return { success: false, error: '⏳ Generate gambar butuh waktu lebih lama dari biasanya. Coba lagi nanti.' };
}

module.exports = { generateImage };
