/**
 * Manajer sesi navigasi bernomor (dipakai .menu dan .toggle untuk fitur
 * "reply angka untuk pilih/switch"). Dipusatkan di sini supaya hanya ada
 * SATU sesi navigasi aktif per JID di satu waktu — mencegah ambiguitas
 * ketika user membuka .menu lalu .toggle (atau sebaliknya) di chat yang
 * sama, lalu reply angka yang berpotensi ditafsir oleh kedua sesi sekaligus.
 */

const sessionsByType = {
    menu: new Map(),
    toggle: new Map(),
};

/**
 * Mendaftarkan sesi navigasi baru untuk sebuah JID dan TIPE tertentu,
 * sekaligus otomatis menghapus sesi tipe LAIN untuk JID yang sama.
 */
function registerSession(type, jid, data) {
    for (const [otherType, map] of Object.entries(sessionsByType)) {
        if (otherType !== type) map.delete(jid);
    }
    sessionsByType[type].set(jid, data);
}

function getSession(type, jid) {
    return sessionsByType[type].get(jid) || null;
}

function clearSession(type, jid) {
    sessionsByType[type].delete(jid);
}

module.exports = { registerSession, getSession, clearSession };
