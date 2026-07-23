/**
 * SISTEM ANTI-BLOKIR WHATSAPP
 * ============================
 * PENTING UNTUK DIPAHAMI: tidak ada kode yang membuat bot Baileys "kebal"
 * dari blokir WhatsApp secara mutlak. WhatsApp mendeteksi pola pemakaian
 * tidak wajar di sisi SERVER mereka, bukan sesuatu yang bisa "dikalahkan"
 * dari sisi kode bot. Modul ini MENGURANGI RISIKO dengan meniru pola
 * pemakaian manusia dan mencegah kesalahan pemakaian paling umum yang
 * memicu blokir (spam, broadcast tanpa jeda, auto-reply flood), bukan
 * menjamin keamanan 100%.
 *
 * Yang benar-benar terbukti memicu blokir menurut pola umum di komunitas
 * Baileys/bot WhatsApp:
 * 1. Broadcast massal tanpa jeda antar pesan
 * 2. Bot dipakai banyak orang asing tak dikenal dari 1 nomor (dianggap spam)
 * 3. Auto-reply ke grup isinya sesama bot (pola non-manusia)
 * 4. Nomor baru langsung dipakai agresif tanpa "pemanasan" bertahap
 */

const config = require('../config/config');

// ===== 1. DELAY NATURAL ANTAR PESAN =====
// Menambahkan jeda kecil dan acak sebelum mengirim pesan, meniru waktu
// "mengetik" manusia, alih-alih membalas instan seperti robot.
function humanDelay(minMs = 800, maxMs = 2000) {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
}

// ===== 2. RATE LIMITER PER-USER (mencegah 1 orang spam command) =====
// Sliding window sederhana: maksimal N command dalam T detik per user.
const userActivityLog = new Map(); // jid -> array of timestamps

function checkUserRateLimit(jid, { maxRequests = 15, windowMs = 60000 } = {}) {
    const now = Date.now();
    const log = userActivityLog.get(jid) || [];

    // Buang timestamp yang sudah di luar window
    const recentLog = log.filter(t => now - t < windowMs);

    if (recentLog.length >= maxRequests) {
        return { allowed: false, retryAfterMs: windowMs - (now - recentLog[0]) };
    }

    recentLog.push(now);
    userActivityLog.set(jid, recentLog);
    return { allowed: true };
}

// Bersihkan log lama secara berkala supaya Map tidak membengkak selamanya.
// .unref() supaya timer ini tidak menahan proses Node tetap hidup jika
// tidak ada pekerjaan lain (mencegah proses "menggantung" saat testing/shutdown).
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [jid, log] of userActivityLog.entries()) {
        const recentLog = log.filter(t => now - t < 120000);
        if (recentLog.length === 0) {
            userActivityLog.delete(jid);
        } else {
            userActivityLog.set(jid, recentLog);
        }
    }
}, 5 * 60 * 1000);
cleanupInterval.unref();

// ===== 3. BROADCAST THROTTLING =====
// Broadcast adalah aktivitas PALING BERISIKO untuk blokir. Delay antar
// pesan dibuat lebih besar dan acak, plus jeda ekstra setiap N pesan
// (meniru jeda "istirahat" manusia, bukan proses mesin yang terus-menerus).
//
// CATATAN: sock.sendMessage yang dipanggil di sini (setelah wrapSockForAntiban
// aktif) SUDAH otomatis kena delay dasar ~400-900ms dari wrapper. Delay
// tambahan di bawah ini (1.5-3.5 detik) ditumpuk DI ATAS itu, khusus untuk
// broadcast supaya total jeda antar pesan cukup besar (~2-4.5 detik) — lebih
// besar dari delay normal karena broadcast mengirim ke banyak target asing
// sekaligus, bukan cuma satu balasan chat seperti biasa.
async function throttledBroadcast(sock, targets, buildMessage, { onProgress } = {}) {
    let success = 0;
    let failed = 0;

    for (let i = 0; i < targets.length; i++) {
        try {
            await sock.sendMessage(targets[i], buildMessage(targets[i]));
            success++;
        } catch (err) {
            failed++;
        }

        if (onProgress) onProgress(i + 1, targets.length, success, failed);

        // Delay TAMBAHAN antar pesan (di luar delay wrapper): 1.5-3.5 detik acak
        await humanDelay(1500, 3500);

        // Jeda ekstra tiap 20 pesan, meniru "istirahat" manusia
        if ((i + 1) % 20 === 0 && i + 1 < targets.length) {
            await humanDelay(15000, 30000);
        }
    }

    return { success, failed };
}

// ===== 4. ANTI-FLOOD DETECTION (mencegah bot ikut spam saat di-spam) =====
// Jika satu JID mengirim pesan bertubi-tubi dalam waktu sangat singkat,
// bot berhenti merespon sementara alih-alih ikut membalas setiap pesan
// (yang justru membuat bot sendiri terlihat seperti spammer).
const floodTracker = new Map(); // jid -> array of timestamps
const floodCooldown = new Set(); // jid yang sedang di-cooldown karena flood

function isBeingFlooded(jid, { threshold = 8, windowMs = 10000 } = {}) {
    if (floodCooldown.has(jid)) return true;

    const now = Date.now();
    const log = floodTracker.get(jid) || [];
    const recentLog = log.filter(t => now - t < windowMs);
    recentLog.push(now);
    floodTracker.set(jid, recentLog);

    if (recentLog.length >= threshold) {
        floodCooldown.add(jid);
        // Cooldown otomatis lepas setelah 60 detik. unref() supaya konsisten
        // dengan interval lain — tidak menahan proses tetap hidup jika tidak perlu.
        const cooldownTimer = setTimeout(() => floodCooldown.delete(jid), 60000);
        cooldownTimer.unref();
        return true;
    }

    return false;
}

// ===== 5. WARM-UP MODE (untuk nomor baru) =====
// Nomor WhatsApp yang baru pertama kali dipakai untuk bot lebih rawan
// diblokir jika langsung dipakai agresif. Mode ini membatasi command
// per-hari lebih ketat selama periode pemanasan (default 3 hari pertama),
// naik bertahap ke limit normal.
function getWarmupMultiplier(botFirstConnectedAt) {
    if (!botFirstConnectedAt) return 1;
    const daysSinceFirstConnect = (Date.now() - botFirstConnectedAt) / (1000 * 60 * 60 * 24);

    if (daysSinceFirstConnect < 1) return 0.2;  // hari 1: 20% dari limit normal
    if (daysSinceFirstConnect < 3) return 0.5;  // hari 2-3: 50%
    if (daysSinceFirstConnect < 7) return 0.8;  // hari 4-7: 80%
    return 1; // setelah 7 hari: limit normal penuh
}

// Mencatat/membaca timestamp koneksi pertama bot dari database settings.
// Dipanggil sekali saat connection.update === 'open' pertama kali terjadi.
function recordFirstConnectIfNeeded() {
    const db = require('./database');
    const existing = db.settings.get('botFirstConnectedAt');
    if (!existing) {
        db.settings.set('botFirstConnectedAt', Date.now());
        return Date.now();
    }
    return existing;
}

function getFirstConnectedAt() {
    const db = require('./database');
    return db.settings.get('botFirstConnectedAt') || null;
}

function isInWarmupPeriod() {
    const firstConnect = getFirstConnectedAt();
    if (!firstConnect) return false;
    const daysSince = (Date.now() - firstConnect) / (1000 * 60 * 60 * 24);
    return daysSince < 7;
}

// ===== 6. WRAPPER OTOMATIS UNTUK sock.sendMessage =====
// Daripada mengedit satu-satu ratusan pemanggilan sock.sendMessage di semua
// plugin, socket dibungkus SEKALI di sini supaya SETIAP pesan keluar dari
// bot (command apa pun) otomatis kena delay natural + typing indicator,
// meniru pola respon manusia alih-alih instan seperti mesin.
//
// Delay dibuat proporsional terhadap panjang teks (pesan panjang = delay
// lebih lama, meniru waktu mengetik), dengan batas atas supaya tidak
// membuat bot terasa lemot untuk pemakaian normal.
//
// presenceSubscribe() melakukan network round-trip ke server WhatsApp
// (bukan operasi gratis/instan) — di-cache per-JID selama 10 menit supaya
// TIDAK dipanggil ulang di SETIAP pesan (yang akan menambah latency nyata
// ke semua command, termasuk yang seharusnya instan seperti .ping).
const presenceSubscribedCache = new Map(); // jid -> timestamp terakhir subscribe
const PRESENCE_CACHE_TTL = 10 * 60 * 1000;

function wrapSockForAntiban(sock) {
    const originalSendMessage = sock.sendMessage.bind(sock);

    sock.sendMessage = async (jid, content, options) => {
        try {
            const lastSubscribed = presenceSubscribedCache.get(jid) || 0;
            if (Date.now() - lastSubscribed > PRESENCE_CACHE_TTL) {
                await sock.presenceSubscribe(jid).catch(() => {});
                presenceSubscribedCache.set(jid, Date.now());
            }
            await sock.sendPresenceUpdate('composing', jid).catch(() => {});
        } catch (_) {
            // presence update boleh gagal diam-diam, bukan bagian kritis
        }

        // Delay dasar 400-900ms + tambahan proporsional panjang teks (maks +1500ms)
        const textLength = content?.text?.length || 0;
        const lengthBonus = Math.min(textLength * 8, 1500);
        await humanDelay(400 + lengthBonus * 0.3, 900 + lengthBonus);

        try {
            await sock.sendPresenceUpdate('paused', jid).catch(() => {});
        } catch (_) {}

        return originalSendMessage(jid, content, options);
    };

    return sock;
}

// Bersihkan cache presence subscribe lama juga, supaya Map tidak membengkak
// selamanya untuk bot yang melayani banyak kontak/grup berbeda.
const presenceCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [jid, timestamp] of presenceSubscribedCache.entries()) {
        if (now - timestamp > PRESENCE_CACHE_TTL) {
            presenceSubscribedCache.delete(jid);
        }
    }
}, 15 * 60 * 1000);
presenceCleanupInterval.unref();

module.exports = { humanDelay, checkUserRateLimit, throttledBroadcast, isBeingFlooded, getWarmupMultiplier, recordFirstConnectIfNeeded, getFirstConnectedAt, isInWarmupPeriod, wrapSockForAntiban };
