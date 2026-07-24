module.exports = {
    command: ['promote', 'jadikan admin'],
    category: 'group',
    description: 'Menjadikan member sebagai admin grup',
    groupOnly: true,
    adminOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const target = mentioned?.[0] || quotedParticipant || (args[0] ? `${args[0].replace(/\D/g, '')}@s.whatsapp.net` : null);

        if (!target) {
            return sock.sendMessage(jid, { text: '📝 Tag, reply, atau masukkan nomor.\nContoh: *.promote @user*' }, { quoted: msg });
        }

        try {
            await sock.groupParticipantsUpdate(jid, targets, 'promote');
            await sock.sendMessage(jid, { text: `✅ Berhasil menjadikan admin.`, mentions: targets }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Gagal. Detail: ${err.message}` }, { quoted: msg });
        }
    }
};
