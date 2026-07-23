module.exports = {
    command: ['demote', 'turunkan admin'],
    category: 'group',
    description: 'Menurunkan admin grup menjadi member biasa',
    groupOnly: true,
    adminOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid }) => {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const targets = mentioned?.length ? mentioned : (quotedParticipant ? [quotedParticipant] : []);

        if (targets.length === 0) {
            return sock.sendMessage(jid, { text: '📝 Tag atau reply user.\nContoh: *.demote @user*' }, { quoted: msg });
        }

        try {
            await sock.groupParticipantsUpdate(jid, targets, 'demote');
            await sock.sendMessage(jid, { text: `✅ Berhasil menurunkan dari admin.`, mentions: targets }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Gagal. Detail: ${err.message}` }, { quoted: msg });
        }
    }
};
