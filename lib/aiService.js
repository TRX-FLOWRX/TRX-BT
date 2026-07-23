const { speechToText } = require('./sttClient');
const { analyzeImage } = require('./visionClient');
const { askAI } = require('./aiClient');
const logger = require('./logger');

async function translateVoice(audioBuffer, targetLanguage) {
  const sttResult = await speechToText(audioBuffer);
  if (!sttResult.success) {
    return { success: false, error: sttResult.error };
  }

  try {
    const prompt = `Terjemahkan teks berikut ke dalam bahasa ${targetLanguage}: ${sttResult.transcript}`;
    const aiResult = await askAI('system', prompt, null, { maxTokens: 256, allowFallback: true });
    if (!aiResult.success) {
      return { success: false, error: aiResult.error };
    }
    return { success: true, transcript: sttResult.transcript, translation: aiResult.reply };
  } catch (err) {
    logger.error({ err }, 'Gagal translate voice');
    return { success: false, error: 'Gagal menerjemahkan voice note saat ini.' };
  }
}

async function visionAnalyze(imageBuffer, prompt) {
  const result = await analyzeImage(imageBuffer, prompt);
  if (!result.success) return result;
  return result;
}

module.exports = { translateVoice, visionAnalyze };
