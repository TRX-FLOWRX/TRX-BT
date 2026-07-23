const { getTransaction, rejectTransaction } = require('../../lib/transactionModel');

module.exports = {
    command: ['reject', 'tolak'],
    category: 'payment',
    description: 'Menolak transaksi pembayaran (owner only)',
    ownerOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const trxId = (args[0] || '').toUpperCase();
        const reason = args.slice(1).join(' ') || 'Bukti transfer tidak valid';

        if (!trxId) {
            return sock.sendMessage(jid, { text: '📝 Format: *.reject <trx_id> <alasan>*' }, { quoted: msg });
        }

        const trx = getTransaction(trxId);
        if (!trx) {
            return sock.sendMessage(jid, { text: '❌ Transaksi tidak ditemukan.' }, { quoted: msg });
        }
        if (trx.status !== 'pending') {
            return sock.sendMessage(jid, { text: `⚠️ Transaksi sudah berstatus: ${trx.status}` }, { quoted: msg });
        }

        rejectTransaction(trxId, reason);
        await sock.sendMessage(jid, { text: `❌ Transaksi *${trxId}* ditolak.\nAlasan: ${reason}` }, { quoted: msg });

        try {
            await sock.sendMessage(trx.buyerJid, {
                text: `❌ Maaf, transaksi *${trxId}* kamu ditolak.\nAlasan: ${reason}\n\nSilakan hubungi owner jika ada kesalahan.`
            });
        } catch (err) {
            console.error('[NOTIFY REJECT ERROR]', err.message);
        }
    }
};
