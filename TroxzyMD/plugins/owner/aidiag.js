const axios = require('axios');
const config = require('../../config/config');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    command: ['aidiag', 'diagai', 'cekai'],
    category: 'owner',
    description: 'Diagnostic koneksi API AI - cek API key, model, dan koneksi secara detail (owner only)',
    ownerOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid }) => {
        await sock.sendMessage(jid, { text: '🔍 Menjalankan diagnostic API AI, mohon tunggu...' }, { quoted: msg });

        let report = `🔍 *DIAGNOSTIC API AI*\n\n`;

        // ===== TEST 1: Cek API key ter-set (bukan placeholder) =====
        const keyIsPlaceholder = !config.ai.apiKey || config.ai.apiKey === 'GANTI_DENGAN_KEY_BARU_KAMU';
        report += `1️⃣ API Key ter-set: ${keyIsPlaceholder ? '❌ TIDAK (masih placeholder atau kosong!)' : '✅ Ya (' + config.ai.apiKey.slice(0, 8) + '...)'}\n\n`;

        if (keyIsPlaceholder) {
            report += `⚠️ *STOP DI SINI* — AI_API_KEY di file .env server kamu masih placeholder atau kosong. Ini penyebab paling umum semua fitur AI gagal. Isi AI_API_KEY di .env dengan key asli dari FreeTheAi, lalu restart bot.\n`;
            return sock.sendMessage(jid, { text: report }, { quoted: msg });
        }

        // ===== TEST 2: Cek base URL bisa dijangkau sama sekali =====
        try {
            const modelsRes = await axios.get(`${config.ai.baseUrl}/models`, {
                headers: { 'Authorization': `Bearer ${config.ai.apiKey}` },
                timeout: 15000,
            });
            report += `2️⃣ Koneksi ke base URL: ✅ Berhasil (HTTP ${modelsRes.status})\n`;

            const modelList = modelsRes.data?.data?.map(m => m.id) || [];
            const glmExists = modelList.some(id => id === config.ai.model);
            report += `3️⃣ Model "${config.ai.model}" ada di katalog: ${glmExists ? '✅ Ya' : '❌ TIDAK DITEMUKAN'}\n\n`;

            if (!glmExists) {
                report += `⚠️ Model "${config.ai.model}" tidak ada di daftar model yang bisa diakses API key ini. Kemungkinan: nama alias berubah, atau model ini butuh role/akses khusus yang belum kamu punya. Cek https://freetheai.xyz/models untuk alias terkini.\n\n`;
            }
        } catch (err) {
            const status = err.response?.status;
            report += `2️⃣ Koneksi ke base URL: ❌ GAGAL\n`;
            report += `   Status HTTP: ${status || 'tidak ada respons'}\n`;
            report += `   Error: ${err.response?.data?.error?.message || err.message}\n\n`;

            if (status === 401 || status === 403) {
                report += `⚠️ Status ${status} biasanya berarti API KEY TIDAK VALID atau sudah dicabut/expired. Cek ulang API key kamu di dashboard/Discord FreeTheAi.\n`;
            } else if (err.code === 'ECONNABORTED') {
                report += `⚠️ Request timeout — server FreeTheAi mungkin sedang down atau lambat merespons endpoint /models.\n`;
            }
            return sock.sendMessage(jid, { text: report }, { quoted: msg });
        }

        // ===== TEST 3: Coba actual chat completion dengan prompt sangat pendek =====
        try {
            const start = Date.now();
            const chatRes = await axios.post(
                `${config.ai.baseUrl}/chat/completions`,
                {
                    model: config.ai.model,
                    messages: [{ role: 'user', content: 'Balas dengan kata "OK" saja.' }],
                    max_tokens: 10,
                },
                {
                    headers: { 'Authorization': `Bearer ${config.ai.apiKey}`, 'Content-Type': 'application/json' },
                    timeout: 25000,
                }
            );
            const elapsed = Date.now() - start;
            const reply = chatRes.data?.choices?.[0]?.message?.content;
            report += `4️⃣ Test chat completion (${config.ai.model}): ✅ Berhasil dalam ${elapsed}ms\n`;
            report += `   Balasan: "${reply}"\n\n`;
            report += `✅ *KESIMPULAN: API dan model "${config.ai.model}" berfungsi normal saat ini.* Jika .ai tetap gagal untuk user, kemungkinan besar itu error SEMENTARA (timeout di jam sibuk, rate limit harian), bukan masalah konfigurasi permanen.`;
        } catch (err) {
            const status = err.response?.status;
            const errorType = err.response?.data?.error?.type;
            const errorMsg = err.response?.data?.error?.message || err.message;

            report += `4️⃣ Test chat completion (${config.ai.model}): ❌ GAGAL\n`;
            report += `   Status HTTP: ${status || 'tidak ada respons (kemungkinan timeout)'}\n`;
            report += `   Error type: ${errorType || (err.code === 'ECONNABORTED' ? 'timeout' : 'unknown')}\n`;
            report += `   Detail lengkap: ${errorMsg}\n\n`;

            if (errorType === 'model_access_denied') {
                report += `⚠️ Model "${config.ai.model}" butuh role Discord khusus (seems_legit) yang kemungkinan belum kamu punya. Ini PENYEBAB PALING MUNGKIN kalau GLM konsisten gagal — cek status role kamu di Discord FreeTheAi.\n`;
            } else if (errorType === 'daily_checkin_required') {
                report += `⚠️ Perlu /checkin ulang hari ini di Discord FreeTheAi.\n`;
            } else if (errorType === 'glm_depleted') {
                report += `⚠️ Kuota GLM gratis sedang habis untuk beberapa jam ke depan. Coba lagi nanti.\n`;
            } else if (err.code === 'ECONNABORTED') {
                report += `⚠️ Timeout di test manual ini juga — server FreeTheAi/model ini kemungkinan memang lambat merespons saat ini.\n`;
            }
        }

        await sock.sendMessage(jid, { text: report }, { quoted: msg });
    }
};
