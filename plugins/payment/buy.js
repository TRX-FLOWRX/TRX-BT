const fs = require('fs-extra');
const config = require('../../config/config');
const { createTransaction } = require('../../lib/transactionModel');
const { createQrisTransaction, isConfigured } = require('../../lib/midtransClient');

function formatRupiah(num) {
    return 'Rp' + num.toLocaleString('id-ID');
}

module.exports = {
    command: ['buy', 'beli', 'premium'],
    category: 'payment',
    description: 'Membeli paket premium via QRIS (otomatis jika Midtrans sudah dikonfigurasi, manual jika belum)',
    limitCost: 0,
    execute: async (msg, { sock, jid, args, sender }) => {
        const packageKey = (args[0] || '').toLowerCase();
        const packages = config.premiumPrices;

        if (!packageKey || !packages[packageKey]) {
            let text = `💎 *PAKET PREMIUM ${config.botName}*\n\n`;
            for (const [key, price] of Object.entries(packages)) {
                text += `▸ *${key}* — ${formatRupiah(price)}\n`;
            }
            text += `\n📝 Cara beli:\n*.buy <paket>*\nContoh: *.buy 30hari*\n\n`;
            text += isConfigured()
                ? `_Pembayaran QRIS otomatis — premium aktif langsung setelah kamu bayar, tanpa perlu konfirmasi manual._`
                : `_Pembayaran via QRIS, dikonfirmasi manual oleh owner (${config.telegramOwner}) setelah transfer._`;
            return sock.sendMessage(jid, { text }, { quoted: msg });
        }

        const basePrice = packages[packageKey];
        const trx = createTransaction(sender, packageKey, basePrice);

        // ===== JALUR OTOMATIS (Midtrans sudah dikonfigurasi owner) =====
        if (!isConfigured()) {
            return sock.sendMessage(jid, {
                text: '❌ Midtrans belum dikonfigurasi. Owner harus mengisi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di .env agar pembayaran otomatis berjalan nyata (tanpa manual).'
            }, { quoted: msg });
        }

        const result = await createQrisTransaction({
            orderId: trx.id,
            amount: trx.totalPrice,
            customerName: sender.split('@')[0],
        });

        if (!result.success) {
            console.error('[BUY] Midtrans ERROR', result);
            return sock.sendMessage(jid, {
                text: `❌ Gagal membuat transaksi Midtrans: ${result.message}`
            }, { quoted: msg });
        }

        if (!Buffer.isBuffer(result.qrImageBuffer) || result.qrImageBuffer.length === 0) {
            return sock.sendMessage(jid, {
                text: '❌ Midtrans berhasil membuat transaksi, tetapi QR code tidak dapat ditampilkan. Coba lagi nanti atau cek konfigurasi akun Midtrans.'
            }, { quoted: msg });
        }

        let caption = `🧾 *INVOICE PEMBAYARAN OTOMATIS (Midtrans)*\n\n`;
        caption += `📦 Paket    : ${packageKey}\n`;
        caption += `🆔 Trx ID   : ${trx.id}\n`;
        caption += `💵 *TOTAL BAYAR: ${formatRupiah(trx.totalPrice)}*\n\n`;
        caption += `✅ Scan QR di bawah dan bayar sesuai total. Premium AKTIF SECARA OTOMATIS setelah Midtrans mengonfirmasi pembayaran.\n\n`;
        caption += `⏰ QR berlaku sampai: ${result.expiryTime || '15 menit dari sekarang'}`;

        return sock.sendMessage(jid, { image: result.qrImageBuffer, caption }, { quoted: msg });
    }
};
