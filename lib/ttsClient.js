const axios = require('axios');
const config = require('../config/config');
const { translateAiError } = require('./aiClient');

/**
 * Text-to-Speech via endpoint resmi FreeTheAi: POST /v1/audio/speech
 * Referensi: https://freetheai.xyz/docs#endpoints
 * Mengembalikan audio sebagai arraybuffer (biasanya MP3) yang bisa langsung
 * dikirim sebagai audio message di WhatsApp.
 */
async function callTtsModel(text, model, { voice = 'default' } = {}) {
    return axios.post(
        `${config.ai.baseUrl}/audio/speech`,
        {
            model,
            input: text,
            voice,
        },
        {
            headers: {
                'Authorization': `Bearer ${config.ai.apiKey}`,
                'Content-Type': 'application/json',
            },
            responseType: 'arraybuffer',
            timeout: 45000,
        }
    );
}

function parseTtsError(err) {
    if (err.response?.data && Buffer.isBuffer(err.response.data)) {
        try {
            const errJson = JSON.parse(err.response.data.toString('utf-8'));
            return translateAiError({ response: { status: err.response.status, data: errJson, headers: err.response.headers } });
        } catch {
            return {
                userMessage: '❌ Gagal membuat audio saat ini. Coba lagi sebentar.',
                logDetail: `[TTS PARSE ERROR] Gagal parse JSON dari buffer error. Detail: ${err.message}`,
            };
        }
    }
    return translateAiError(err);
}

function shouldTryFallback(err) {
    const code = err.code || '';
    const type = err.response?.data?.error?.type || '';
    return code === 'ECONNABORTED' || /timeout/i.test(code || err.message || '') || ['glm_depleted', 'provider_unavailable', 'model_access_denied', 'provider_error', 'rate_limit_error', 'concurrency_limit_error'].includes(type);
}

async function textToSpeech(text, { voice = 'default' } = {}) {
    const primaryModel = config.ai.ttsModel;
    const fallbackModel = config.ai.ttsFallbackModel;

    try {
        const response = await callTtsModel(text, primaryModel, { voice });
        return { success: true, audioBuffer: Buffer.from(response.data), modelUsed: primaryModel };
    } catch (err) {
        const translated = parseTtsError(err);
        console.error('[TTS ERROR]', translated.logDetail);

        if (fallbackModel && fallbackModel !== primaryModel && shouldTryFallback(err)) {
            console.log(`[TTS FALLBACK] ${primaryModel} gagal, mencoba model cadangan ${fallbackModel}...`);
            try {
                const response = await callTtsModel(text, fallbackModel, { voice });
                return { success: true, audioBuffer: Buffer.from(response.data), modelUsed: fallbackModel, usedFallback: true };
            } catch (fallbackErr) {
                const fallbackTranslated = parseTtsError(fallbackErr);
                console.error('[TTS FALLBACK ERROR]', fallbackTranslated.logDetail);
                return { success: false, error: fallbackTranslated.userMessage };
            }
        }

        return { success: false, error: translated.userMessage };
    }
}

module.exports = { textToSpeech };
