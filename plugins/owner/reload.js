module.exports = {
    command: ['reload'],
    category: 'owner',
    description: 'Memuat ulang semua plugin dan system prompt tanpa restart bot (owner only)',
    ownerOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid }) => {
        try {
            const { reloadPlugins } = require('../../lib/connection');
            const { clearPromptCache } = require('../../lib/promptLoader');
            const { allPlugins } = reloadPlugins();
            clearPromptCache();
            await sock.sendMessage(jid, { text: `✅ Berhasil reload ${allPlugins.length} plugin dan system prompt.` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Gagal reload.\nDetail: ${err.message}` }, { quoted: msg });
        }
    }
};
