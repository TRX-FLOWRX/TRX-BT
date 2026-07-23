const config = require('../../config/config');

// Daftar model non-vova yang terverifikasi ada di katalog FreeTheAi per awal Juli 2026.
// Owner tetap bisa pakai model lain di luar daftar ini via .setmodel <alias_manual>,
// daftar ini hanya untuk memudahkan pemilihan cepat.
const RECOMMENDED_MODELS = {
    'glm-5.2': 'glm/glm-5.2',       // Context 1M, terkuat untuk reasoning & coding, default bot
    'glm-5.1': 'glm/glm-5.1',       // Cadangan kalau glm-5.2 bermasalah
    'deepseek': 'opc/deepseek-v4-flash-free', // Gratis, jadi fallback model
    'mimo': 'mim/mimo-v2.5-pro',    // Context 1M, alternatif lain
    'kimi': 'olm/kimi-k2.7-code',   // Fokus coding
};

module.exports = {
    command: ['setmodel', 'gantimodel'],
    category: 'owner',
    description: 'Mengganti model AI default bot secara langsung (owner only)',
    ownerOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const target = (args[0] || '').toLowerCase();

        if (!target || target === 'list') {
            let text = `🤖 *MODEL AI SAAT INI*\n\n`;
            text += `Model utama: *${config.ai.model}*\n`;
            text += `Model fallback: *${config.ai.fallbackModel}*\n\n`;
            text += `📋 Shortcut yang tersedia:\n`;
            for (const [key, alias] of Object.entries(RECOMMENDED_MODELS)) {
                text += `▸ *.setmodel ${key}* → ${alias}\n`;
            }
            text += `\n✏️ Bisa juga pakai alias manual: *.setmodel <prefix/nama-model>*\n`;
            text += `_Lihat katalog lengkap di https://freetheai.xyz/models_\n\n`;
            text += `⚠️ Perubahan ini hanya berlaku sampai bot di-restart. Untuk permanen, ubah AI_MODEL di file .env.`;
            return sock.sendMessage(jid, { text }, { quoted: msg });
        }

        // Jika ada di shortcut, pakai itu. Kalau tidak, anggap user memberi alias manual langsung.
        const newModel = RECOMMENDED_MODELS[target] || args[0];

        if (newModel.toLowerCase().startsWith('vova/')) {
            return sock.sendMessage(jid, {
                text: `⚠️ Model "${newModel}" memakai prefix vova/ yang setahu owner ingin dihindari (kadang dihapus provider). Kalau tetap mau pakai, jalankan lagi dengan konfirmasi: *.setmodel force ${newModel}*`
            }, { quoted: msg });
        }

        config.ai.model = newModel;
        await sock.sendMessage(jid, { text: `✅ Model AI utama diubah ke: *${newModel}*\n\n_Catatan: ini berlaku sampai bot restart. Test dulu dengan .ai sebelum dipakai publik._` }, { quoted: msg });
    }
};
