const config = require('../../config/config');
const userModel = require('../../lib/userModel');
const moment = require('moment-timezone');
const navSession = require('../../lib/navSessionManager');

const MENU_SESSION_TTL = 3 * 60 * 1000;

const CATEGORY_ICONS = {
    main: '📋', ai: '🤖', downloader: '📥', converter: '🔄',
    group: '👥', owner: '👑', tools: '🛠️', fun: '🎉',
    sticker: '🖼️', payment: '💳', website: '🌐', rpg: '⚔️', economy: '💰'
};

const CATEGORY_LABELS = {
    main: 'Menu Utama', ai: 'AI & Chatbot', downloader: 'Downloader', converter: 'Converter Media',
    group: 'Manajemen Grup', owner: 'Owner Only', tools: 'Tools & Utilitas', fun: 'Game & Hiburan',
    sticker: 'Sticker Maker', payment: 'Premium & Payment', website: 'Website Generator',
    rpg: 'RPG & Kerja', economy: 'Ekonomi & Saldo'
};

// Command paling sering dipakai per kategori, ditampilkan di .menu ringkas.
// Kategori/command di luar daftar ini hanya muncul lewat .allmenu.
const HIGHLIGHT_COMMANDS = {
    ai: ['ai', 'imagine', 'tts', 'persona'],
    downloader: ['tiktok', 'youtube', 'instagram'],
    tools: ['profile', 'qrcode', 'calc'],
    sticker: ['sticker'],
    economy: ['daily', 'tukarlimit'],
    fun: ['suit', 'tebakangka'],
};

function buildHeader(user, allPlugins) {
    const now = moment().tz('Asia/Jakarta').format('dddd, DD MMMM YYYY - HH:mm:ss');
    const totalCommands = allPlugins.reduce((sum, p) => sum + p.command.length, 0);
    const isPremium = userModel.isPremiumActive(user);

    let text = `╭─❍❁『 *${config.botName}* 』❁❍\n`;
    text += `│ 👤 User      : ${user.name || 'Belum diatur'}\n`;
    text += `│ 💎 Status    : ${isPremium ? 'Premium ✨' : 'Free'}\n`;
    text += `│ ⚡ Limit     : ${user.dailyLimit}\n`;
    text += `│ 🕐 Waktu     : ${now}\n`;
    text += `│ 📦 Total Cmd : ${totalCommands}+ command\n`;
    text += `╰────────────────\n\n`;
    return text;
}

/**
 * Menu RINGKAS (.menu) — hanya menampilkan command populer per kategori,
 * langsung dalam 1 pesan tanpa perlu navigasi angka. Cocok untuk pemakaian
 * cepat sehari-hari. Untuk daftar LENGKAP semua command, arahkan ke .allmenu.
 */
function buildQuickMenuText(user, allPlugins) {
    const grouped = {};
    for (const plugin of allPlugins) {
        const cat = plugin._category || 'lainnya';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(plugin);
    }

    let text = buildHeader(user, allPlugins);
    text += `⭐ *MENU CEPAT* (command paling sering dipakai)\n\n`;

    for (const [cat, commandNames] of Object.entries(HIGHLIGHT_COMMANDS)) {
        const plugins = grouped[cat] || [];
        const icon = CATEGORY_ICONS[cat] || '📁';
        const label = CATEGORY_LABELS[cat] || cat.toUpperCase();

        const matched = plugins.filter(p => commandNames.includes(p.command[0]));
        if (matched.length === 0) continue;

        text += `${icon} *${label}*\n`;
        for (const p of matched) {
            const badge = p.premium ? ' 💎' : '';
            text += `▸ ${config.prefix[0]}${p.command[0]}${badge}\n`;
        }
        text += `\n`;
    }

    text += `_📋 Ini cuma sebagian — ketik *${config.prefix[0]}allmenu* untuk lihat SEMUA command per kategori._\n`;
    text += `_Powered by ${config.ownerName} | ${config.telegramOwner}_`;

    return text;
}

/**
 * Menu LENGKAP (.allmenu) — sistem interaktif bertingkat: daftar semua
 * kategori bernomor, reply angka untuk lihat SEMUA command di kategori itu.
 */
function buildFullCategoryListText(user, allPlugins) {
    const grouped = {};
    for (const plugin of allPlugins) {
        const cat = plugin._category || 'lainnya';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(plugin);
    }

    const categories = Object.keys(grouped);
    let text = buildHeader(user, allPlugins);
    text += `🗂️ *SEMUA KATEGORI* (reply nomornya di chat ini)\n\n`;

    categories.forEach((cat, i) => {
        const icon = CATEGORY_ICONS[cat] || '📁';
        const label = CATEGORY_LABELS[cat] || cat.toUpperCase();
        text += `*${i + 1}.* ${icon} ${label} _(${grouped[cat].length} fitur)_\n`;
    });

    text += `\n_💬 Balas dengan angka 1-${categories.length} untuk lihat SEMUA command di kategori itu._\n`;
    text += `_Sesi menu ini aktif selama 3 menit._\n\n`;
    text += `_Powered by ${config.ownerName} | ${config.telegramOwner}_`;

    return { text, categories, grouped };
}

function buildCategoryDetailText(catKey, plugins) {
    const icon = CATEGORY_ICONS[catKey] || '📁';
    const label = CATEGORY_LABELS[catKey] || catKey.toUpperCase();

    let text = `╭─❍❁『 ${icon} *${label}* 』❁❍\n`;
    for (const p of plugins) {
        const badge = p.premium ? ' 💎' : '';
        const ownerBadge = p.ownerOnly ? ' 👑' : '';
        const aliases = p.command.length > 1 ? ` _(alias: ${p.command.slice(1).join(', ')})_` : '';
        text += `│ ${config.prefix[0]}${p.command[0]}${badge}${ownerBadge}${aliases}\n`;
        if (p.description) {
            text += `│   ↳ ${p.description}\n`;
        }
    }
    text += `╰────────────────\n\n`;
    text += `_Ketik ${config.prefix[0]}allmenu lagi untuk kembali ke daftar kategori._`;

    return text;
}

/**
 * Dipanggil dari nonCommandHandler untuk menangkap reply angka terhadap
 * menu LENGKAP (.allmenu) yang sedang aktif. Return true jika pesan ini
 * berhasil ditangani sebagai navigasi menu.
 */
async function handleMenuNavigation(sock, msg, jid, body) {
    const session = navSession.getSession('menu', jid);
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
        navSession.clearSession('menu', jid);
        return false;
    }

    const choice = parseInt(body.trim());
    if (isNaN(choice) || choice < 1 || choice > session.categories.length) return false;

    const catKey = session.categories[choice - 1];
    const plugins = session.grouped[catKey];
    const detailText = buildCategoryDetailText(catKey, plugins);

    await sock.sendMessage(jid, { text: detailText }, { quoted: msg });
    navSession.clearSession('menu', jid); // sesi selesai setelah user pilih 1 kategori
    return true;
}

module.exports = {
    command: ['menu', 'help'],
    category: 'main',
    description: 'Menampilkan menu cepat (command populer). Untuk semua command, pakai .allmenu',
    cooldown: 3,
    limitCost: 0,
    execute: async (msg, { sock, jid, sender }) => {
        const { getPlugins } = require('../../lib/connection');
        const { allPlugins } = getPlugins();
        const user = userModel.getUser(sender);

        const text = buildQuickMenuText(user, allPlugins);
        await sock.sendMessage(jid, { text }, { quoted: msg });
    },
    _handleMenuNavigation: handleMenuNavigation,
    _buildFullCategoryListText: buildFullCategoryListText,
};
