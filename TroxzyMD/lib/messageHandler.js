const config = require('../config/config');
const userModel = require('./userModel');
const groupModel = require('./groupModel');
const { checkUserRateLimit, isBeingFlooded, humanDelay } = require('./antiban');

const cooldowns = new Map(); // key: `${jid}:${command}` -> timestamp

// Command yang tetap bisa diakses meski user BELUM registrasi/verifikasi
// channel — kalau tidak di-whitelist, user baru tidak akan pernah bisa
// registrasi sama sekali karena .register sendiri ikut terblokir.
const REGISTRATION_EXEMPT_COMMANDS = new Set(['register', 'daftar', 'verifikasi', 'verify', 'menu', 'help', 'owner', 'creator', 'ping']);

function extractCommand(text) {
    if (!text) return null;
    const prefixUsed = config.prefix.find(p => text.startsWith(p));
    if (!prefixUsed) return null;

    const withoutPrefix = text.slice(prefixUsed.length).trim();
    const [command, ...rest] = withoutPrefix.split(/\s+/);
    return {
        command: (command || '').toLowerCase(),
        args: rest,
        text: rest.join(' '),
    };
}

async function handleMessage(sock, msg, { commandMap, isAdmin, isBotAdmin }) {
    try {
        const jid = msg.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');

        // Baileys v7 memperkenalkan LID (Local Identifier): di beberapa grup/kontak,
        // msg.key.participant bisa berupa LID (xxxx@lid) alih-alih nomor telepon asli
        // (xxxx@s.whatsapp.net). participantAlt (grup) / remoteJidAlt (DM) berisi
        // JID alternatif (PN jika participant adalah LID, atau sebaliknya).
        // Kita pakai participant apa adanya sebagai identitas utama (konsisten dipakai
        // sebagai key database), tapi untuk cek owner kita periksa KEDUA kemungkinan
        // supaya command owner tetap terdeteksi walau participant berupa LID.
        const sender = isGroup ? msg.key.participant : jid;
        const senderAlt = isGroup ? msg.key.participantAlt : msg.key.remoteJidAlt;

        const numberFromSender = sender?.replace(/\D/g, '') || '';
        const numberFromAlt = senderAlt?.replace(/\D/g, '') || '';
        const isOwner = numberFromSender.includes(config.ownerNumber) || numberFromAlt.includes(config.ownerNumber);

        const body =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption ||
            '';

        const parsed = extractCommand(body);

        // ===== SELF MODE: bot hanya merespon owner =====
        if (config.features.selfMode && !isOwner) return;

        // Kalau bukan command, lempar ke handler non-command (misal AI chat mode, game jawaban, dll)
        // Ditangani terpisah di index.js lewat event lain, di sini fokus command saja.
        if (!parsed) return;

        const { command, args, text } = parsed;
        const plugin = commandMap.get(command);
        if (!plugin) return;

        // ===== ANTI-FLOOD (mencegah bot ikut spam-membalas saat sender spam) =====
        // Dicek sebelum apa pun lain, termasuk untuk owner — owner yang salah pencet
        // berkali-kali juga tidak seharusnya membuat bot spam balasan.
        if (isBeingFlooded(sender)) return;

        // ===== RATE LIMITER (mencegah 1 user spam command bertubi-tubi) =====
        // Ini beda dari cooldown per-command: ini batas TOTAL command per user
        // dalam jendela waktu, lintas semua command, untuk cegah pola pemakaian
        // yang terlihat seperti bot/spam di mata WhatsApp.
        if (!isOwner) {
            const rateCheck = checkUserRateLimit(sender);
            if (!rateCheck.allowed) {
                const waitSec = Math.ceil(rateCheck.retryAfterMs / 1000);
                return sock.sendMessage(jid, {
                    text: `⏳ Kamu mengirim command terlalu cepat. Tunggu ${waitSec} detik ya.\n\n_(Ini melindungi akun bot dari deteksi spam WhatsApp — bukan cuma buat kamu.)_`
                }, { quoted: msg });
            }
        }

        // ===== GROUP SETTING CHECK =====
        if (isGroup) {
            const groupData = groupModel.getGroup(jid);
            if (groupData.muted && !isOwner) return;
        }

        // ===== RESTRIKSI PLUGIN =====
        if (plugin.ownerOnly && !isOwner) {
            return sock.sendMessage(jid, { text: '🚫 Command ini khusus untuk owner bot.' }, { quoted: msg });
        }
        if (plugin.groupOnly && !isGroup) {
            return sock.sendMessage(jid, { text: '🚫 Command ini hanya bisa digunakan di dalam grup.' }, { quoted: msg });
        }
        if (plugin.privateOnly && isGroup) {
            return sock.sendMessage(jid, { text: '🚫 Command ini hanya bisa digunakan di chat pribadi.' }, { quoted: msg });
        }
        if (plugin.adminOnly && isGroup && !isOwner) {
            const adminStatus = await isAdmin(jid, sender);
            if (!adminStatus) {
                return sock.sendMessage(jid, { text: '🚫 Command ini khusus admin grup.' }, { quoted: msg });
            }
        }

        const user = userModel.getUser(sender);

        if (user.banned) {
            return sock.sendMessage(jid, { text: `🚫 Kamu di-banned dari penggunaan bot.\nAlasan: ${user.banReason || 'Tidak ada alasan.'}` }, { quoted: msg });
        }

        // ===== GATE REGISTRASI + VERIFIKASI CHANNEL WAJIB =====
        // Owner dan command yang di-whitelist (register, menu, dll) selalu lolos,
        // supaya user baru tetap bisa mendaftar dan admin tetap bisa kerja.
        if (!isOwner && !REGISTRATION_EXEMPT_COMMANDS.has(command) && !plugin.ownerOnly) {
            if (!user.registered) {
                return sock.sendMessage(jid, {
                    text: `📝 Kamu belum registrasi. Ketik *.register <nama>* dulu sebelum bisa pakai fitur bot.`
                }, { quoted: msg });
            }
            if (!user.channelVerified) {
                return sock.sendMessage(jid, {
                    text: `⏳ Registrasi kamu belum diverifikasi.\n\nFollow channel kami dulu:\n${config.channelLink}\n\nLalu kirim screenshot bukti dengan caption *.verifikasi*`
                }, { quoted: msg });
            }
        }

        if (plugin.premium && !userModel.isPremiumActive(user) && !isOwner) {
            return sock.sendMessage(jid, {
                text: `💎 Command *${command}* khusus untuk user *Premium*.\n\nKetik *.premium* untuk lihat cara upgrade.`
            }, { quoted: msg });
        }

        
        if (plugin.requiresAgeVerified && !user.isVerified18 && !isOwner) {
            return sock.sendMessage(jid, {
                text: `🔞 Command *${command}* hanya bisa dipakai oleh user yang sudah terverifikasi usia 18+.
Ketik *.verifyage 18* untuk mulai proses verifikasi.`
            }, { quoted: msg });
        }
// ===== COOLDOWN CHECK =====
        if (plugin.cooldown && !isOwner) {
            const key = `${sender}:${command}`;
            const last = cooldowns.get(key) || 0;
            const now = Date.now();
            const diff = (now - last) / 1000;
            if (diff < plugin.cooldown) {
                const remaining = Math.ceil(plugin.cooldown - diff);
                return sock.sendMessage(jid, { text: `⏳ Tunggu ${remaining} detik lagi sebelum menggunakan command ini.` }, { quoted: msg });
            }
            cooldowns.set(key, now);
        }

        // ===== LIMIT CHECK (skip untuk owner) =====
        const limitCost = plugin.limitCost ?? 1;
        if (limitCost > 0 && !isOwner) {
            if (!userModel.hasEnoughLimit(sender, limitCost)) {
                return sock.sendMessage(jid, {
                    text: `⚠️ Limit harian kamu sudah habis.\nLimit reset otomatis setiap hari jam 00:00.\n\nKetik *.premium* untuk limit lebih besar tanpa batas ketat.`
                }, { quoted: msg });
            }
        }

        // ===== EXECUTE PLUGIN =====
        await plugin.execute(msg, {
            sock,
            args,
            text,
            command,
            jid,
            sender,
            isGroup,
            isOwner,
            user,
        });

        if (limitCost > 0 && !isOwner) {
            userModel.decreaseLimit(sender, limitCost);
        }

    } catch (err) {
        console.error('[HANDLER ERROR]', err);
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Terjadi kesalahan saat menjalankan command.\n\nDetail: ${err.message}`
            }, { quoted: msg });
        } catch (_) {}
    }
}

module.exports = { handleMessage, extractCommand };
