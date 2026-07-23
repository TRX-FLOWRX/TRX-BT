const config = require('../../config/config');
const { getTransaction, confirmTransaction, rejectTransaction, getAllPending } = require('../../lib/transactionModel');
const userModel = require('../../lib/userModel');

const DURATION_MS = {
    '7hari': 7 * 24 * 60 * 60 * 1000,
    '30hari': 30 * 24 * 60 * 60 * 1000,
    '90hari': 90 * 24 * 60 * 60 * 1000,
    'lifetime': 0,
};

module.exports = {
    command: ['approve', 'acc'],
    category: 'payment',
    description: 'Menyetujui transaksi pembayaran (owner only)',
    ownerOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const trxId = (args[0] || '').toUpperCase();

        if (!trxId) {
            const pending = getAllPending();
            if (pending.length === 0) {
                return sock.sendMessage(jid, { text: '📭 Tidak ada transaksi pending saat ini.' }, { quoted: msg });
            }
            let text = `📋 *TRANSAKSI PENDING*\n\n`;
            for (const t of pending) {
                text += `🆔 ${t.id} — @${t.buyerJid.split('@')[0]} — ${t.packageName} — Rp${t.totalPrice.toLocaleString('id-ID')}\n`;
            }
            return sock.sendMessage(jid, { text, mentions: pending.map(t => t.buyerJid) }, { quoted: msg });
        }

        const trx = getTransaction(trxId);
        if (!trx) {
            return sock.sendMessage(jid, { text: '❌ Transaksi tidak ditemukan.' }, { quoted: msg });
        }
        if (trx.status !== 'pending') {
            return sock.sendMessage(jid, { text: `⚠️ Transaksi sudah berstatus: ${trx.status}` }, { quoted: msg });
        }

        confirmTransaction(trxId, jid);
        const duration = DURATION_MS[trx.packageName] ?? 0;
        userModel.setPremium(trx.buyerJid, duration);

        await sock.sendMessage(jid, { text: `✅ Transaksi *${trxId}* disetujui. User telah diupgrade ke Premium (${trx.packageName}).` }, { quoted: msg });

        try {
            await sock.sendMessage(trx.buyerJid, {
                text: `🎉 Selamat! Pembayaran kamu untuk paket *${trx.packageName}* telah dikonfirmasi.\n\nAkun kamu sekarang *Premium* ✨\nTerima kasih sudah mendukung ${config.botName}!`
            });
        } catch (err) {
            console.error('[NOTIFY BUYER ERROR]', err.message);
        }
    }
};
