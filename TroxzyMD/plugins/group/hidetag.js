module.exports = {
    command: ['hidetag', 'ht'],
    category: 'group',
    description: 'Mengirim pesan dengan mention tersembunyi ke semua member',
    groupOnly: true,
    adminOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, text }) => {
        try {
            const metadata = await sock.groupMetadata(jid);
            const allParticipants = metadata.participants.map(p => p.id);

            await sock.sendMessage(jid, {
                text: text || '📢',
                mentions: allParticipants
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Gagal. Detail: ${err.message}` }, { quoted: msg });
        }
    }
};
