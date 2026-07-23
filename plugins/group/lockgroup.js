module.exports = {
    command: ['lockgroup', 'kuncigrup'],
    category: 'group',
    description: 'Mengunci grup agar hanya admin yang bisa mengirim pesan',
    groupOnly: true,
    adminOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const mode = (args[0] || '').toLowerCase();

        try {
            if (mode === 'off' || mode === 'buka') {
                await sock.groupSettingUpdate(jid, 'not_announcement');
                return sock.sendMessage(jid, { text: '🔓 Grup dibuka. Semua member sekarang bisa chat.' }, { quoted: msg });
            } else {
                await sock.groupSettingUpdate(jid, 'announcement');
                return sock.sendMessage(jid, { text: '🔒 Grup dikunci. Hanya admin yang bisa chat sekarang.' }, { quoted: msg });
            }
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Gagal. Pastikan bot adalah admin.\nDetail: ${err.message}` }, { quoted: msg });
        }
    }
};
