const { enableAiChat, disableAiChat, isAiChatEnabled } = require('../../lib/nonCommandHandler');
const { resetHistory } = require('../../lib/aiClient');

module.exports = {
    command: ['aichat'],
    category: 'ai',
    description: 'Aktifkan mode chat AI natural tanpa command (khusus private chat)',
    limitCost: 0,
    privateOnly: true,
    execute: async (msg, { sock, jid, args, sender }) => {
        const mode = (args[0] || '').toLowerCase();

        if (mode === 'on') {
            enableAiChat(sender);
            return sock.sendMessage(jid, {
                text: '✅ Mode *AI Chat Natural* diaktifkan.\nSekarang kamu bisa chat langsung tanpa command .ai\n\nKetik *.aichat off* untuk mematikan.'
            }, { quoted: msg });
        }

        if (mode === 'off') {
            disableAiChat(sender);
            return sock.sendMessage(jid, { text: '❌ Mode AI Chat Natural dimatikan.' }, { quoted: msg });
        }

        if (mode === 'reset') {
            resetHistory(sender);
            return sock.sendMessage(jid, { text: '🔄 Riwayat percakapan AI kamu telah direset.' }, { quoted: msg });
        }

        const status = isAiChatEnabled(sender) ? 'AKTIF ✅' : 'NONAKTIF ❌';
        return sock.sendMessage(jid, {
            text: `🤖 Status AI Chat Natural: *${status}*\n\nGunakan:\n*.aichat on* - aktifkan\n*.aichat off* - matikan\n*.aichat reset* - reset riwayat obrolan`
        }, { quoted: msg });
    }
};
