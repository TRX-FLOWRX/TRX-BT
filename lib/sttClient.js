const axios = require('axios');
const FormData = require('form-data');
const config = require('../config/config');
const { translateAiError } = require('./aiClient');

/**
 * Speech-to-Text via endpoint resmi FreeTheAi: POST /v1/audio/transcriptions
 * Endpoint ini menerima multipart/form-data (OpenAI-style), bukan JSON biasa.
 * Referensi: https://freetheai.xyz/docs#endpoints
 */
async function callSttModel(audioBuffer, model, filename = 'audio.ogg') {
    const form = new FormData();
    form.append('file', audioBuffer, { filename });
    form.append('model', model);

    return axios.post(
        `${config.ai.baseUrl}/audio/transcriptions`,
        form,
        {
            headers: {
                'Authorization': `Bearer ${config.ai.apiKey}`,
                ...form.getHeaders(),
            },
            timeout: 45000,
        }
    );
}

function shouldTryFallback(err) {
    const code = err.code || '';
    const type = err.response?.data?.error?.type || '';
    return code === 'ECONNABORTED' || /timeout/i.test(code || err.message || '') || ['glm_depleted', 'provider_unavailable', 'model_access_denied', 'provider_error', 'rate_limit_error', 'concurrency_limit_error'].includes(type);
}

async function speechToText(audioBuffer, filename = 'audio.ogg') {
    const primaryModel = config.ai.sttModel;
    const fallbackModel = config.ai.sttFallbackModel;

    try {
        const response = await callSttModel(audioBuffer, primaryModel, filename);
        const transcript = response.data?.text?.trim();
        if (!transcript) throw new Error('Transkrip kosong.');
        return { success: true, transcript, modelUsed: primaryModel };
    } catch (err) {
        const translated = translateAiError(err);
        console.error('[STT ERROR]', translated.logDetail);

        if (fallbackModel && fallbackModel !== primaryModel && shouldTryFallback(err)) {
            console.log(`[STT FALLBACK] ${primaryModel} gagal, mencoba model cadangan ${fallbackModel}...`);
            try {
                const response = await callSttModel(audioBuffer, fallbackModel, filename);
                const transcript = response.data?.text?.trim();
                if (!transcript) throw new Error('Transkrip kosong.');
                return { success: true, transcript, modelUsed: fallbackModel, usedFallback: true };
            } catch (fallbackErr) {
                const fallbackTranslated = translateAiError(fallbackErr);
                console.error('[STT FALLBACK ERROR]', fallbackTranslated.logDetail);
                return { success: false, error: fallbackTranslated.userMessage };
            }
        }

        return { success: false, error: translated.userMessage };
    }
}

module.exports = { speechToText };
