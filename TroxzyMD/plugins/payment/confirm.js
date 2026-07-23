const config = require('../../config/config');
const { getTransaction } = require('../../lib/transactionModel');

module.exports = {
    command: ['confirm', 'konfirmasi'],
    category: 'payment',
    description: 'Konfirmasi bukti pembayaran ke owner',
    limitCost: 0,
    execute: async (msg, { sock, jid, args, sender }) => {
        const trxId = (args[0] || '').toUpperCase();

        if (!trxId) {
            return sock.sendMessage(jid, { text: '📝 Format: *.confirm <trx_id>*\n\nContoh: .confirm TRX1A2B3C4D' }, { quoted: msg });
        }

        const trx = getTransaction(trxId);
        if (!trx) {
            return sock.sendMessage(jid, { text: '❌ Transaksi tidak ditemukan. Periksa kembali Trx ID kamu.' }, { quoted: msg });
        }
        if (trx.buyerJid !== sender) {
            return sock.sendMessage(jid, { text: '❌ Transaksi ini bukan milikmu.' }, { quoted: msg });
        }
        if (trx.status !== 'pending') {
            return sock.sendMessage(jid, { text: `⚠️ Transaksi ini sudah berstatus: *${trx.status}*` }, { quoted: msg });
        }

        // Cek apakah user melampirkan gambar (bukti transfer)
        const hasImage = !!msg.message?.imageMessage;
        const quotedHasImage = !!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

        if (!hasImage && !quotedHasImage) {
            return sock.sendMessage(jid, {
                text: '📸 Lampirkan screenshot bukti transfer bersama command ini (kirim gambar dengan caption *.confirm TRXxxx*), atau reply gambar bukti dengan caption yang sama.'
            }, { quoted: msg });
        }

        // Kirim notifikasi ke owner
        const ownerJid = config.ownerNumber + '@s.whatsapp.net';
        const notifText = `🔔 *KONFIRMASI PEMBAYARAN BARU*\n\n`
            + `🆔 Trx ID  : ${trx.id}\n`
            + `👤 Buyer   : @${sender.split('@')[0]}\n`
            + `📦 Paket   : ${trx.packageName}\n`
            + `💵 Total   : Rp${trx.totalPrice.toLocaleString('id-ID')}\n\n`
            + `✅ Approve : *.approve ${trx.id}*\n`
            + `❌ Reject  : *.reject ${trx.id} <alasan>*`;

        try {
            await sock.sendMessage(ownerJid, { text: notifText, mentions: [sender] });

            // Forward bukti gambar ke owner jika ada
            if (hasImage) {
                await sock.sendMessage(ownerJid, { forward: msg });
            }
        } catch (err) {
            console.error('[CONFIRM FORWARD ERROR]', err.message);
        }

        await sock.sendMessage(jid, {
            text: `✅ Bukti pembayaran untuk *${trx.id}* telah diteruskan ke owner.\n\nMohon tunggu konfirmasi. Kamu akan diberi tahu otomatis setelah disetujui.`
        }, { quoted: msg });
    }
};
