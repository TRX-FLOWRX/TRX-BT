const axios = require('axios');
const config = require('../config/config');

/**
 * Client untuk Midtrans SNAP API (QRIS otomatis).
 *
 * CATATAN PENTING: fitur ini TIDAK AKAN AKTIF sampai owner mendaftar akun
 * Midtrans sendiri (butuh KTP, proses via https://midtrans.com) dan mengisi
 * MIDTRANS_SERVER_KEY + MIDTRANS_CLIENT_KEY di .env. Selama key belum diisi,
 * semua fungsi di bawah akan return error yang jelas, BUKAN pura-pura sukses.
 *
 * Alur kerja: (1) buat transaksi -> dapat QR code dinamis dari Midtrans,
 * (2) user scan & bayar, (3) Midtrans kirim webhook notifikasi ke server kita
 * begitu pembayaran sukses -> (4) sistem otomatis upgrade user ke premium,
 * TANPA perlu owner approve manual seperti sistem QR statis sebelumnya.
 */

const MIDTRANS_BASE_URL = config.midtrans.isProduction
    ? 'https://api.midtrans.com'
    : 'https://api.sandbox.midtrans.com';

function isConfigured() {
    return typeof config.midtrans.serverKey === 'string' && config.midtrans.serverKey.trim() !== '';
}

/**
 * Membuat transaksi QRIS baru lewat Midtrans Core API (charge endpoint).
 * Mengembalikan URL gambar QR code yang bisa langsung dikirim ke user.
 */
async function createQrisTransaction({ orderId, amount, customerName }) {
    if (!isConfigured()) {
        return {
            success: false,
            error: 'MIDTRANS_NOT_CONFIGURED',
            message: 'Payment gateway otomatis belum dikonfigurasi owner. Sistem masih pakai QR manual — gunakan .buy seperti biasa.',
        };
    }

    try {
        const authHeader = Buffer.from(`${config.midtrans.serverKey}:`).toString('base64');

        const response = await axios.post(
            `${MIDTRANS_BASE_URL}/v2/charge`,
            {
                payment_type: 'qris',
                transaction_details: {
                    order_id: orderId,
                    gross_amount: amount,
                },
                customer_details: {
                    first_name: customerName || 'Pelanggan',
                },
                qris: {
                    acquirer: 'gopay',
                },
            },
            {
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                timeout: 20000,
            }
        );

        const qrAction = response.data.actions?.find(a => a.name === 'generate-qr-code');

        // BUG YANG DIPERBAIKI: field `url` di dalam actions BUKAN link gambar
        // langsung — itu endpoint API terpisah yang harus di-GET untuk dapat
        // gambar QR code aslinya (dikonfirmasi dari dokumentasi resmi Midtrans:
        // https://docs.midtrans.com/reference/qris). Sebelumnya kode ini
        // langsung memakai qrAction.url sebagai link gambar, yang menyebabkan
        // Baileys gagal render gambar (URL itu me-return JSON API, bukan
        // binary gambar) — inilah penyebab error "Cannot read properties of
        // undefined (reading toString)" yang dilaporkan user, karena di
        // beberapa kasus qrAction sendiri undefined dan errornya menjalar
        // sampai ke dalam Baileys saat mencoba proses URL yang tidak valid.
        if (!qrAction?.url) {
            console.error('[MIDTRANS ERROR] Response sukses tapi tidak ada action generate-qr-code:', JSON.stringify(response.data));
            return {
                success: false,
                error: 'MIDTRANS_NO_QR_ACTION',
                message: 'Transaksi dibuat tapi Midtrans tidak mengembalikan QR code (kemungkinan konfigurasi akun Midtrans belum lengkap untuk QRIS). Cek dashboard Midtrans, atau hubungi support mereka.',
            };
        }

        // Fetch gambar QR ASLI dari endpoint action (bukan pakai url-nya langsung)
        let qrImageBuffer;
        try {
            const qrImageResponse = await axios.get(qrAction.url, {
                responseType: 'arraybuffer',
                timeout: 15000,
            });
            qrImageBuffer = Buffer.from(qrImageResponse.data);
        } catch (qrFetchErr) {
            console.error('[MIDTRANS ERROR] Gagal fetch gambar QR dari endpoint action:', qrFetchErr.message);
            return {
                success: false,
                error: 'MIDTRANS_QR_FETCH_FAILED',
                message: 'Transaksi dibuat tapi gagal mengambil gambar QR code dari Midtrans. Coba lagi sebentar.',
            };
        }

        return {
            success: true,
            orderId: response.data.order_id,
            transactionId: response.data.transaction_id,
            qrImageBuffer, // Buffer gambar asli, siap dikirim langsung via sock.sendMessage
            expiryTime: response.data.expiry_time,
            status: response.data.transaction_status,
        };
    } catch (err) {
        const midtransMsg = err.response?.data?.status_message || err.message;
        console.error('[MIDTRANS ERROR]', midtransMsg);
        return {
            success: false,
            error: 'MIDTRANS_API_ERROR',
            message: `Gagal membuat transaksi QRIS otomatis. Detail teknis (untuk owner): ${midtransMsg}`,
        };
    }
}

/**
 * Mengecek status transaksi secara manual (polling). Biasanya TIDAK
 * diperlukan kalau webhook sudah dikonfigurasi dengan benar, tapi berguna
 * sebagai fallback/verifikasi manual oleh owner.
 */
async function checkTransactionStatus(orderId) {
    if (!isConfigured()) {
        return { success: false, error: 'MIDTRANS_NOT_CONFIGURED' };
    }

    try {
        const authHeader = Buffer.from(`${config.midtrans.serverKey}:`).toString('base64');
        const response = await axios.get(
            `${MIDTRANS_BASE_URL}/v2/${orderId}/status`,
            {
                headers: { 'Authorization': `Basic ${authHeader}`, 'Accept': 'application/json' },
                timeout: 15000,
            }
        );
        return { success: true, status: response.data.transaction_status, data: response.data };
    } catch (err) {
        return { success: false, error: err.response?.data?.status_message || err.message };
    }
}

/**
 * Memverifikasi signature webhook Midtrans supaya notifikasi yang diterima
 * server benar-benar dari Midtrans, bukan dipalsukan pihak lain. WAJIB
 * dipanggil di webhook handler sebelum memproses notifikasi apa pun.
 */
function verifyWebhookSignature({ orderId, statusCode, grossAmount, signatureKey }) {
    if (!isConfigured()) return false;
    const crypto = require('crypto');
    const expectedSignature = crypto
        .createHash('sha512')
        .update(orderId + statusCode + grossAmount + config.midtrans.serverKey)
        .digest('hex');
    return expectedSignature === signatureKey;
}

module.exports = { createQrisTransaction, checkTransactionStatus, verifyWebhookSignature, isConfigured };
