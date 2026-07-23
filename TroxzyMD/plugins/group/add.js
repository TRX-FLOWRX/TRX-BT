module.exports = {
    command: ['add', 'tambah'],
    category: 'group',
    description: 'Menambahkan member ke grup',
    groupOnly: true,
    adminOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const number = args[0]?.replace(/\D/g, '');
        if (!number) {
            return sock.sendMessage(jid, { text: '📝 Format: *.add <nomor>*\nContoh: .add 628123456789' }, { quoted: msg });
        }

        const target = `${number}@s.whatsapp.net`;

        try {
            const result = await sock.groupParticipantsUpdate(jid, [target], 'add');
            const status = result[0]?.status;

            if (status === '200') {
                await sock.sendMessage(jid, { text: `✅ Berhasil menambahkan ${number}.` }, { quoted: msg });
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
