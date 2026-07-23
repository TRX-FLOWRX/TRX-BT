module.exports = {
    command: ['setdesc', 'gantidesc'],
    category: 'group',
    description: 'Mengganti deskripsi grup',
    groupOnly: true,
    adminOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, text }) => {
        if (!text) {
            return sock.sendMessage(jid, { text: '📝 Format: *.setdesc <deskripsi baru>*' }, { quoted: msg });
        }
        try {
            await sock.groupUpdateDescription(jid, text);
            await sock.sendMessage(jid, { text: `✅ Deskripsi grup berhasil diubah.` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Gagal mengubah deskripsi grup.\nDetail: ${err.message}` }, { quoted: msg });
        }
    }
};
