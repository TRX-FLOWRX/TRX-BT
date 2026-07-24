module.exports = {
    command: ['add', 'tambah'],
    category: 'group',
    description: 'Menambahkan member ke grup',
    groupOnly: true,
    adminOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const target = mentioned?.[0] || quotedParticipant || (args[0] ? `${args[0].replace(/\D/g, '')}@s.whatsapp.net` : null);

        if (!target || !target.includes('@')) {
            return sock.sendMessage(jid, { text: '📝 Format: *.add <nomor>* atau tag user\nContoh: .add 628123456789 atau .add @user' }, { quoted: msg });
        }

        try {
            const result = await sock.groupParticipantsUpdate(jid, [target], 'add');
            const status = result[0]?.status;
            const displayNumber = target.includes('@') ? target.split('@')[0] : target;

            if (status === '200') {
                await sock.sendMessage(jid, { text: `✅ Berhasil menambahkan ${displayNumber}.` }, { quoted: msg });
            } else {
                await sock.sendMessage(jid, {
                    text: `⚠️ Tidak bisa menambahkan langsung (mungkin privasi user). Mengirim invite link sebagai gantinya jika memungkinkan.`
                }, { quoted: msg });
            }
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Gagal menambahkan member.\nDetail: ${err.message}` }, { quoted: msg });
        }
    }
};
