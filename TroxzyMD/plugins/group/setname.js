module.exports = {
    command: ['setname', 'gantinamagrup'],
    category: 'group',
    description: 'Mengganti nama grup',
    groupOnly: true,
    adminOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, text }) => {
        if (!text) {
            return sock.sendMessage(jid, { text: '📝 Format: *.setname <nama baru>*' }, { quoted: msg });
        }
        try {
            await sock.groupUpdateSubject(jid, text);
            await sock.sendMessage(jid, { text: `✅ Nama grup berhasil diubah menjadi: *${text}*` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Gagal mengubah nama grup.\nDetail: ${err.message}` }, { quoted: msg });
        }
    }
};
