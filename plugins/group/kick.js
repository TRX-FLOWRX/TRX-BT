module.exports = {
    command: ['kick', 'tendang'],
    category: 'group',
    description: 'Mengeluarkan member dari grup',
    groupOnly: true,
    adminOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

        const targets = mentioned?.length ? mentioned : (quotedParticipant ? [quotedParticipant] : []);

        if (targets.length === 0) {
            return sock.sendMessage(jid, { text: '📝 Tag atau reply user yang ingin dikeluarkan.\nContoh: *.kick @user*' }, { quoted: msg });
        }

        try {
            await sock.groupParticipantsUpdate(jid, targets, 'remove');
            await sock.sendMessage(jid, {
                text: `✅ Berhasil mengeluarkan ${targets.length} member.`,
                mentions: targets
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Gagal kick. Pastikan bot adalah admin grup.\nDetail: ${err.message}` }, { quoted: msg });
        }
    }
};
