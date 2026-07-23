const axios = require('axios');
const config = require('../config/config');

// Menyimpan history percakapan per-user agar AI ingat konteks (maks 10 pesan terakhir)
const conversationHistory = new Map();

const MAX_HISTORY = 10;

function getHistory(jid) {
    if (!conversationHistory.has(jid)) {
        conversationHistory.set(jid, []);
    }
    return conversationHistory.get(jid);
}

function resetHistory(jid) {
    conversationHistory.set(jid, []);
}

/**
 * Menerjemahkan error dari provider AI menjadi pesan yang jelas untuk
 * pengguna bot. PENTING — SEMUA userMessage di bawah ini SENGAJA generik
 * dan TIDAK menyebut nama provider/platform apa pun (FreeTheAi, Discord,
 * dll), supaya user biasa yang pakai bot tidak tahu dari mana API key
 * didapat. Detail teknis lengkap (termasuk nama provider asli) tetap
 * dicatat ke console server lewat logDetail — itu hanya owner yang bisa
 * lihat lewat log Pterodactyl, bukan dikirim ke chat WhatsApp mana pun.
 */
function translateAiError(err) {
    const status = err.response?.status;
    const errorType = err.response?.data?.error?.type;
    const errorMsg = err.response?.data?.error?.message || err.message;
    const retryAfter = err.response?.headers?.['retry-after'];
    const isTimeout = err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '');

    switch (errorType) {
        case 'daily_checkin_required':
            return {
                userMessage: '🔧 Layanan AI sedang dalam maintenance rutin. Coba lagi dalam beberapa saat.',
                retriable: true,
                logDetail: `[OWNER ONLY] daily_checkin_required — jalankan /checkin di Discord FreeTheAi. Detail: ${errorMsg}`,
            };
        case 'invalid_api_key':
            return {
                userMessage: '🔧 Layanan AI sedang tidak bisa diakses. Owner sudah diberi tahu.',
                retriable: false,
                logDetail: `[OWNER ONLY] invalid_api_key — cek ulang AI_API_KEY di .env. Detail: ${errorMsg}`,
            };
        case 'model_access_denied':
            return {
                userMessage: '🔧 Fitur AI ini sedang tidak tersedia untuk sementara.',
                retriable: false,
                logDetail: `[OWNER ONLY] model_access_denied — butuh status Verified member di Discord FreeTheAi. Detail: ${errorMsg}`,
            };
        case 'discord_membership_required':
            return {
                userMessage: '🔧 Layanan AI sedang dalam maintenance rutin. Coba lagi dalam beberapa saat.',
                retriable: false,
                logDetail: `[OWNER ONLY] discord_membership_required — pemilik API key perlu join ulang Discord FreeTheAi. Detail: ${errorMsg}`,
            };
        case 'glm_depleted':
            return {
                userMessage: '⏳ Layanan AI sedang sibuk. Coba lagi dalam beberapa jam, atau tunggu bot otomatis mencoba model cadangan.',
                retriable: true,
                logDetail: `[OWNER ONLY] glm_depleted — kuota GLM gratis habis 5 jam. Detail: ${errorMsg}`,
            };
        case 'rate_limit_error':
            return {
                userMessage: `⏳ Layanan AI sedang sibuk.${retryAfter ? ` Coba lagi dalam ${retryAfter} detik.` : ' Coba lagi sebentar lagi.'}`,
                retriable: true,
                logDetail: `[OWNER ONLY] rate_limit_error dari provider. Detail: ${errorMsg}`,
            };
        case 'concurrency_limit_error':
            return {
                userMessage: '⏳ Ada permintaan AI lain yang masih diproses. Tunggu sebentar lalu coba lagi.',
                retriable: true,
                logDetail: `[OWNER ONLY] concurrency_limit_error. Detail: ${errorMsg}`,
            };
        case 'context_length_exceeded':
            return {
                userMessage: '📏 Pesan/riwayat chat terlalu panjang untuk diproses AI. Coba *.aichat reset* untuk hapus riwayat, atau perpendek pertanyaan.',
                retriable: false,
                logDetail: `[OWNER ONLY] context_length_exceeded. Detail: ${errorMsg}`,
            };
        case 'content_policy_violation':
            return {
                userMessage: '🚫 Permintaan ini diblokir oleh filter moderasi AI. Coba ubah kata-kata dalam pertanyaan kamu.',
                retriable: false,
                logDetail: `[OWNER ONLY] content_policy_violation. Detail: ${errorMsg}`,
            };
        case 'provider_error':
        case 'provider_unavailable':
            return {
                userMessage: '⚠️ Layanan AI sedang bermasalah sementara. Coba lagi dalam 30 detik.',
                retriable: true,
                logDetail: `[OWNER ONLY] ${errorType} dari provider. Detail: ${errorMsg}`,
            };
        case 'provider_timeout':
            return {
                userMessage: '⚠️ AI butuh waktu terlalu lama merespon. Coba pertanyaan yang lebih singkat.',
                retriable: true,
                logDetail: `[OWNER ONLY] provider_timeout. Detail: ${errorMsg}`,
            };
        default:
            // Timeout dari axios sendiri (bukan dari provider) — ini yang
            // menyebabkan pesan "timeout of 45000ms exceeded" bocor ke user
            // sebelumnya. Sekarang digeneralisasi juga.
            if (isTimeout) {
                return {
                    userMessage: '⏱️ AI butuh waktu terlalu lama merespon (mungkin pertanyaan terlalu kompleks atau server sedang lambat). Coba lagi atau perpendek pertanyaan.',
                    retriable: true,
                    logDetail: `[TIMEOUT] Request axios timeout. Detail: ${errorMsg}`,
                };
            }
            if (status === 500 || status === 503) {
                return {
                    userMessage: '⚠️ Terjadi gangguan sementara pada layanan AI. Coba lagi sebentar lagi.',
                    retriable: true,
                    logDetail: `[OWNER ONLY] HTTP ${status} dari provider. Detail: ${errorMsg}`,
                };
            }
            // Fallback terakhir: JANGAN kirim errorMsg mentah ke user (bisa
            // saja berisi nama provider/URL/detail teknis lain yang bocor).
            // errorMsg lengkap tetap dicatat di logDetail untuk debugging owner.
            return {
                userMessage: '❌ Gagal mendapat respon dari AI saat ini. Coba lagi sebentar, atau hubungi owner jika terus terjadi.',
                retriable: false,
                logDetail: `[UNHANDLED ERROR] status=${status}, errorType=${errorType}. Detail: ${errorMsg}`,
            };
    }
}

/**
 * Chat completion biasa (non-streaming). model bisa dioverride per-panggilan
 * (misalnya untuk fitur yang butuh model lain selain default GLM-5.2).
 *
 * STRATEGI KECEPATAN (revisi setelah laporan user: "lama nunggu baru pindah
 * model"): sebelumnya timeout 60 detik DAN retry sekali di model yang sama
 * sebelum fallback — total bisa sampai ~120 detik sebelum user dapat jawaban.
 * Sekarang: timeout diturunkan ke 25 detik, dan begitu model utama gagal
 * (timeout ATAU error lain yang fallback-worthy), LANGSUNG pindah ke model
 * cadangan tanpa retry di model yang sama dulu — total waktu tunggu terburuk
 * jadi ~25-50 detik (1x percobaan primer + 1x percobaan fallback), bukan 120.
 *
 * AUTO-FALLBACK: jika model utama (biasanya GLM-5.2) kena glm_depleted,
 * provider_unavailable, model_access_denied (role-gated), atau timeout,
 * otomatis dicoba ulang SEKALI dengan model cadangan — supaya user tidak
 * mentok error atau menunggu lama saat model utama sedang bermasalah.
 */
async function askAI(jid, prompt, systemPrompt = null, { model, maxTokens = 1024, temperature = 0.8, skipHistory = false, allowFallback = true } = {}) {
    const history = skipHistory ? [] : getHistory(jid);

    const messages = [];
    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push(...history, { role: 'user', content: prompt });

    const primaryModel = model || config.ai.model;

    async function callOnce(modelToUse, tokensToUse) {
        const response = await axios.post(
            `${config.ai.baseUrl}/chat/completions`,
            {
                model: modelToUse,
                messages,
                max_tokens: tokensToUse,
                temperature,
            },
            {
                headers: {
                    'Authorization': `Bearer ${config.ai.apiKey}`,
                    'Content-Type': 'application/json',
                },
                // Diturunkan dari 60s ke 25s. Alasan: jika model timeout di 25
                // detik, itu sudah sinyal kuat model sedang lambat/sibuk — lebih
                // baik cepat pindah ke fallback daripada memaksa tunggu lebih
                // lama di model yang sama. User melaporkan proses fallback
                // terasa lambat karena skema lama menunggu sampai 60 detik x2
                // (retry di model sama) sebelum akhirnya pindah model.
                timeout: 25000,
            }
        );

        const reply = response.data?.choices?.[0]?.message?.content?.trim();
        if (!reply) throw new Error('Respon AI kosong.');
        return reply;
    }

    function isTimeoutError(err) {
        return err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '');
    }

    try {
        const reply = await callOnce(primaryModel, maxTokens);

        if (!skipHistory) {
            history.push({ role: 'user', content: prompt });
            history.push({ role: 'assistant', content: reply });
            if (history.length > MAX_HISTORY * 2) {
                history.splice(0, history.length - MAX_HISTORY * 2);
            }
        }

        return { success: true, reply, modelUsed: primaryModel };
    } catch (err) {
        const errorType = err.response?.data?.error?.type;
        // model_access_denied disertakan: biasanya berarti model UTAMA butuh
        // role Discord tertentu (seems_legit) yang belum tentu dibutuhkan
        // juga oleh model FALLBACK — jadi mencoba model lain masuk akal.
        const isFallbackWorthy = errorType === 'glm_depleted' || errorType === 'provider_unavailable' || errorType === 'provider_error' || errorType === 'model_access_denied' || isTimeoutError(err);

        if (allowFallback && isFallbackWorthy && config.ai.fallbackModel && config.ai.fallbackModel !== primaryModel) {
            console.log(`[AI FALLBACK] ${primaryModel} gagal (${errorType || 'timeout'}), langsung mencoba ${config.ai.fallbackModel} (tanpa retry di model yang sama)...`);
            try {
                // Fallback model dicoba dengan maxTokens yang SAMA dulu; kalau
                // fallback JUGA timeout, baru dipangkas separuh — model cadangan
                // biasanya lebih ringan/cepat jadi retry di sini worth it,
                // beda dengan model utama yang tidak di-retry sama sekali.
                let reply;
                try {
                    reply = await callOnce(config.ai.fallbackModel, maxTokens);
                } catch (fbErr) {
                    if (isTimeoutError(fbErr) && maxTokens > 256) {
                        const reducedTokens = Math.floor(maxTokens / 2);
                        console.log(`[AI FALLBACK RETRY] ${config.ai.fallbackModel} timeout, mencoba dengan maxTokens=${reducedTokens}...`);
                        reply = await callOnce(config.ai.fallbackModel, reducedTokens);
                    } else {
                        throw fbErr;
                    }
                }

                if (!skipHistory) {
                    history.push({ role: 'user', content: prompt });
                    history.push({ role: 'assistant', content: reply });
                    if (history.length > MAX_HISTORY * 2) {
                        history.splice(0, history.length - MAX_HISTORY * 2);
                    }
                }

                return { success: true, reply, modelUsed: config.ai.fallbackModel, usedFallback: true };
            } catch (fallbackErr) {
                const translated = translateAiError(fallbackErr);
                console.error('[AI FALLBACK ERROR]', translated.logDetail);
                return { success: false, error: translated.userMessage, retriable: translated.retriable };
            }
        }

        const translated = translateAiError(err);
        console.error('[AI ERROR]', translated.logDetail);
        return { success: false, error: translated.userMessage, retriable: translated.retriable };
    }
}

module.exports = { askAI, resetHistory, getHistory, translateAiError };
