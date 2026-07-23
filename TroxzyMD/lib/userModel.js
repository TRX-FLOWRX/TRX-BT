const db = require('./database');
const config = require('../config/config');
const { getWarmupMultiplier, getFirstConnectedAt } = require('./antiban');

/**
 * Mengambil data user, membuat entry baru dengan default jika belum ada.
 * Otomatis mereset limit harian jika sudah ganti hari.
 */
function getUser(jid) {
    const today = new Date().toISOString().slice(0, 10);

    if (!db.users.has(jid)) {
        db.users.set(jid, {
            jid,
            name: '',
            registered: false,
            premium: false,
            premiumExpired: 0, // timestamp ms, 0 = lifetime/tidak ada
            dailyLimit: computeDailyLimit(false),
            lastLimitReset: today,
            balance: 0,
            xp: 0,
            level: 1,
            banned: false,
            banReason: '',
            warns: 0,
            aiPersona: '', // system prompt custom untuk .ai (kosong = pakai default bot)
            // ===== SISTEM REGISTRASI WAJIB + CHANNEL + REFERRAL =====
            channelVerified: false,      // true setelah owner approve bukti follow channel
            channelVerifiedAt: 0,
            referredBy: '',              // jid yang mereferensikan user ini (kosong = tidak ada)
            referralCode: jid.split('@')[0].slice(-8).toUpperCase(), // kode referral unik milik user ini
            referralCount: 0,            // jumlah orang yang berhasil direferensikan user ini
            referralEarnings: 0,         // total Rp yang didapat dari referral (histori, tidak dikurangi saat withdraw)
            isVerified18: false,
            ageVerifiedAt: 0,
            lastDaily: 0,
            dailyStreak: 0,
            createdAt: Date.now(),
        });
    }

    const user = db.users.get(jid);

    // Auto-reset limit harian
    if (user.lastLimitReset !== today) {
        user.dailyLimit = computeDailyLimit(isPremiumActive(user));
        user.lastLimitReset = today;
        db.users.set(jid, user);
    }

    // Auto-expire premium
    if (user.premium && user.premiumExpired !== 0 && Date.now() > user.premiumExpired) {
        user.premium = false;
        user.premiumExpired = 0;
        db.users.set(jid, user);
    }

    return user;
}

function isPremiumActive(user) {
    if (!user.premium) return false;
    if (user.premiumExpired === 0) return true; // lifetime
    return Date.now() < user.premiumExpired;
}

// Menghitung limit harian efektif, memperhitungkan periode warm-up nomor baru
// (lihat lib/antiban.js untuk detail). Selama 7 hari pertama bot dipakai,
// limit dikurangi bertahap untuk mengurangi risiko blokir pada nomor baru.
function computeDailyLimit(isPremium) {
    const baseLimit = isPremium ? config.limit.premiumDaily : config.limit.freeDaily;
    const firstConnectedAt = getFirstConnectedAt();
    const multiplier = getWarmupMultiplier(firstConnectedAt);
    return Math.max(1, Math.floor(baseLimit * multiplier));
}

function updateUser(jid, partial) {
    return db.users.update(jid, partial);
}

function setPremium(jid, durationMs) {
    const user = getUser(jid);
    const expired = durationMs === 0 ? 0 : Date.now() + durationMs;
    return updateUser(jid, {
        premium: true,
        premiumExpired: expired,
        dailyLimit: computeDailyLimit(true),
    });
}

function removePremium(jid) {
    return updateUser(jid, { premium: false, premiumExpired: 0 });
}

function decreaseLimit(jid, amount = 1) {
    const user = getUser(jid);
    const newLimit = Math.max(0, user.dailyLimit - amount);
    updateUser(jid, { dailyLimit: newLimit });
    return newLimit;
}

function hasEnoughLimit(jid, amount = 1) {
    const user = getUser(jid);
    if (isPremiumActive(user)) return true; // premium tetap dibatasi tapi kuota jauh lebih besar
    return user.dailyLimit >= amount;
}

function addXp(jid, amount) {
    const user = getUser(jid);
    let xp = user.xp + amount;
    let level = user.level;
    let xpNeeded = level * 100;

    let leveledUp = false;
    while (xp >= xpNeeded) {
        xp -= xpNeeded;
        level++;
        xpNeeded = level * 100;
        leveledUp = true;
    }

    updateUser(jid, { xp, level });
    return { xp, level, leveledUp };
}

function addBalance(jid, amount) {
    const user = getUser(jid);
    const balance = user.balance + amount;
    updateUser(jid, { balance });
    return balance;
}

// ===== SISTEM REGISTRASI WAJIB + CHANNEL + REFERRAL =====

const REFERRAL_REWARD = 1500; // Rp per orang yang berhasil direferensikan (registrasi + verifikasi channel)

/**
 * Mengecek apakah user boleh memakai fitur bot (sudah registrasi DAN
 * sudah diverifikasi follow channel oleh owner). Dipakai messageHandler
 * untuk gate semua command non-whitelist.
 */
function isEligibleToUseBot(jid) {
    const user = getUser(jid);
    return Boolean(user.registered) && Boolean(user.channelVerified);
}

/**
 * Mencari user berdasarkan kode referralnya. Dipakai saat user baru
 * memasukkan kode referral orang lain saat registrasi.
 */
function findUserByReferralCode(code) {
    const db = require('./database');
    const allUsers = db.users.getAll();
    const upperCode = code.toUpperCase().trim();
    return Object.values(allUsers).find(u => u.referralCode === upperCode) || null;
}

/**
 * Memberi reward referral ke pereferensi SETELAH user yang direferensikan
 * berhasil diverifikasi channel oleh owner (bukan langsung saat registrasi,
 * supaya tidak bisa dicurangi dengan akun-akun palsu yang tidak pernah
 * benar-benar verified).
 */
function rewardReferral(referrerJid) {
    const user = getUser(referrerJid);
    const newBalance = addBalance(referrerJid, REFERRAL_REWARD);
    updateUser(referrerJid, { referralCount: user.referralCount + 1, referralEarnings: user.referralEarnings + REFERRAL_REWARD });
    return newBalance;
}

module.exports = {
    getUser,
    updateUser,
    setPremium,
    removePremium,
    isPremiumActive,
    decreaseLimit,
    hasEnoughLimit,
    addXp,
    addBalance,
    isEligibleToUseBot,
    findUserByReferralCode,
    rewardReferral,
    REFERRAL_REWARD,
};
