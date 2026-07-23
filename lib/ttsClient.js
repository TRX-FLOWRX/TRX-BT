const axios = require('axios');
const config = require('../config/config');
const { translateAiError } = require('./aiClient');

/**
 * Text-to-Speech via endpoint resmi FreeTheAi: POST /v1/audio/speech
 * Referensi: https://freetheai.xyz/docs#endpoints
 * Mengembalikan audio sebagai arraybuffer (biasanya MP3) yang bisa langsung
 * dikirim sebagai audio message di WhatsApp.
 */
async function textToSpeech(text, { voice = 'default' } = {}) {
    try {
        const response = await axios.post(
            `${config.ai.baseUrl}/audio/speech`,
            {
                model: config.ai.ttsModel,
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

        return { success: true, audioBuffer: Buffer.from(response.data) };
    } catch (err) {
        // Karena responseType arraybuffer, body error JSON perlu di-parse manual
        let translated;
        if (err.response?.data && Buffer.isBuffer(err.response.data)) {
            try {
                const errJson = JSON.parse(err.response.data.toString('utf-8'));
                translated = translateAiError({ response: { status: err.response.status, data: errJson, headers: err.response.headers } });
            } catch {
                translated = {
                    userMessage: '❌ Gagal membuat audio saat ini. Coba lagi sebentar.',
                    logDetail: `[TTS PARSE ERROR] Gagal parse JSON dari buffer error. Detail: ${err.message}`,
                };
            }
        } else {
            translated = translateAiError(err);
        }
        console.error('[TTS ERROR]', translated.logDetail);
        return { success: false, error: translated.userMessage };
    }
}

module.exports = { textToSpeech };
