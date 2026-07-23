module.exports = {
    command: ['link', 'linkgrup'],
    category: 'group',
    description: 'Mendapatkan link invite grup',
    groupOnly: true,
    adminOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid }) => {
        try {
            const code = await sock.groupInviteCode(jid);
            await sock.sendMessage(jid, { text: `🔗 Link Invite Grup:\nhttps://chat.whatsapp.com/${code}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Gagal mendapatkan link. Detail: ${err.message}` }, { quoted: msg });
        }
    }
};
