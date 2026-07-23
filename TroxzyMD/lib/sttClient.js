const axios = require('axios');
const FormData = require('form-data');
const config = require('../config/config');
const { translateAiError } = require('./aiClient');

/**
 * Speech-to-Text via endpoint resmi FreeTheAi: POST /v1/audio/transcriptions
 * Endpoint ini menerima multipart/form-data (OpenAI-style), bukan JSON biasa.
 * Referensi: https://freetheai.xyz/docs#endpoints
 */
async function speechToText(audioBuffer, filename = 'audio.ogg') {
    try {
        const form = new FormData();
        form.append('file', audioBuffer, { filename });
        form.append('model', config.ai.sttModel);

        const response = await axios.post(
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

        const transcript = response.data?.text?.trim();
        if (!transcript) throw new Error('Transkrip kosong.');

        return { success: true, transcript };
    } catch (err) {
        const translated = translateAiError(err);
        console.error('[STT ERROR]', translated.logDetail);
        return { success: false, error: translated.userMessage };
    }
}

module.exports = { speechToText };
