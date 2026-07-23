/**
 * Baileys v7 adalah ESM murni ("type": "module" di package.json-nya).
 * Project ini tetap CommonJS supaya seluruh plugin tidak perlu dimigrasi.
 * Helper ini menyediakan akses ke fungsi-fungsi Baileys yang dipakai
 * plugin (di luar connection.js) lewat dynamic import yang di-cache,
 * jadi tiap file plugin tidak perlu menulis "await import()" sendiri-sendiri.
 */
let cached = null;

async function getBaileysExports() {
    if (!cached) {
        cached = await import('@whiskeysockets/baileys');
    }
    return cached;
}

async function downloadContentFromMessage(mediaMsg, type) {
    const { downloadContentFromMessage: fn } = await getBaileysExports();
    return fn(mediaMsg, type);
}

/**
 * Baileys v7 menyediakan areJidsSameUser() resmi untuk membandingkan 2 JID
 * yang mungkin salah satu/keduanya berupa LID (xxxx@lid) sementara yang lain
 * PN (xxxx@s.whatsapp.net) — lebih aman daripada membandingkan string mentah.
 */
async function areJidsSameUser(jidA, jidB) {
    const { areJidsSameUser: fn } = await getBaileysExports();
    return fn(jidA, jidB);
}

module.exports = { getBaileysExports, downloadContentFromMessage, areJidsSameUser };
