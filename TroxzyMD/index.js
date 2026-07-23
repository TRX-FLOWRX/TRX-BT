const express = require('express');
const chalk = require('chalk');
const config = require('./config/config');
const { startBot, getSock } = require('./lib/connection');
const { verifyWebhookSignature, checkTransactionStatus } = require('./lib/midtransClient');
const { getTransaction, confirmTransaction } = require('./lib/transactionModel');
const userModel = require('./lib/userModel');

// ===== EXPRESS SERVER (untuk keep-alive di Pterodactyl / uptime monitoring) =====
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: config.botName,
        owner: config.ownerName,
        message: `${config.botName} sedang berjalan.`,
    });
});

const DURATION_MS = {
    '7hari': 7 * 24 * 60 * 60 * 1000,
    '30hari': 30 * 24 * 60 * 60 * 1000,
    '90hari': 90 * 24 * 60 * 60 * 1000,
    'lifetime': 0,
};

// ===== WEBHOOK MIDTRANS (payment otomatis) =====
// Endpoint ini dipanggil OTOMATIS oleh server Midtrans setiap ada perubahan
// status transaksi (bukan dipanggil dari WhatsApp/bot). Untuk mengaktifkan,
// owner perlu set URL ini di dashboard Midtrans > Settings > Configuration >
// Payment Notification URL, contoh: https://domain-server-kamu.com/webhook/midtrans
app.post('/webhook/midtrans', async (req, res) => {
    try {
        const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = req.body;

        // WAJIB verifikasi signature dulu — mencegah orang lain memalsukan
        // notifikasi "pembayaran sukses" palsu untuk dapat premium gratis.
        const isValid = verifyWebhookSignature({ orderId: order_id, statusCode: status_code, grossAmount: gross_amount, signatureKey: signature_key });
        if (!isValid) {
            console.error('[WEBHOOK MIDTRANS] Signature tidak valid, kemungkinan request palsu. order_id:', order_id);
            return res.status(403).json({ error: 'Invalid signature' });
        }

        const isSuccess = transaction_status === 'settlement' || (transaction_status === 'capture' && fraud_status === 'accept');

        if (isSuccess) {
            const trx = getTransaction(order_id);
            if (!trx) {
                console.error('[WEBHOOK MIDTRANS] Transaksi tidak ditemukan di database lokal:', order_id);
                return res.status(200).json({ received: true }); // tetap 200 supaya Midtrans tidak retry terus
            }
            if (trx.status === 'confirmed') {
                return res.status(200).json({ received: true, note: 'already processed' });
            }

            confirmTransaction(order_id, 'midtrans-webhook-auto');
            const duration = DURATION_MS[trx.packageName] ?? 0;
            userModel.setPremium(trx.buyerJid, duration);

            console.log(chalk.green(`[WEBHOOK MIDTRANS] Premium otomatis aktif untuk ${trx.buyerJid} (${trx.packageName})`));

            // Kirim notifikasi WhatsApp ke user — pakai getSock() karena
            // webhook ini dipanggil dari luar alur normal messages.upsert.
            const sock = getSock();
            if (sock) {
                try {
                    await sock.sendMessage(trx.buyerJid, {
                        text: `🎉 Pembayaran kamu berhasil diverifikasi OTOMATIS!\n\nPaket *${trx.packageName}* sudah aktif.\nKetik *.menu* untuk mulai pakai fitur premium.`
                    });
                } catch (notifErr) {
                    console.error('[WEBHOOK MIDTRANS] Gagal kirim notifikasi WA:', notifErr.message);
                }
            }
        }

        res.status(200).json({ received: true });
    } catch (err) {
        console.error('[WEBHOOK MIDTRANS ERROR]', err.message);
        res.status(500).json({ error: 'Internal error' });
    }
});

app.listen(config.port, () => {
    console.log(chalk.blue(`[SERVER] Keep-alive server berjalan di port ${config.port}`));
});

// ===== HANDLE UNCAUGHT ERRORS (agar bot tidak crash total karena 1 error kecil) =====
process.on('uncaughtException', (err) => {
    console.error(chalk.red('[UNCAUGHT EXCEPTION]'), err);
});

process.on('unhandledRejection', (reason) => {
    console.error(chalk.red('[UNHANDLED REJECTION]'), reason);
});

// ===== START BOT =====
startBot().catch(err => {
    console.error(chalk.red('[FATAL ERROR] Gagal memulai bot:'), err);
    process.exit(1);
});
