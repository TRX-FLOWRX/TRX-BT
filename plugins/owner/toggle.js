const config = require('../../config/config');
const groupModel = require('../../lib/groupModel');
const navSession = require('../../lib/navSessionManager');

const TOGGLE_SESSION_TTL = 2 * 60 * 1000;

const GLOBAL_TOGGLES = {
    'aichat': { label: 'AI Chat Global', key: 'aiChat' },
    'smartreply': { label: 'Smart Reply AI', key: 'smartReply' },
    'downloader': { label: 'Downloader', key: 'downloader' },
    'sticker': { label: 'Sticker Maker', key: 'sticker' },
    'autoread': { label: 'Auto Read Pesan', key: 'autoRead' },
    'autotyping': { label: 'Auto Typing', key: 'autoTyping' },
    'selfmode': { label: 'Self Mode (bot hanya respon owner)', key: 'selfMode' },
};

const GROUP_TOGGLES = {
    'welcome': { label: 'Welcome Message', key: 'welcome' },
    'goodbye': { label: 'Goodbye Message', key: 'goodbye' },
    'antilink': { label: 'Anti Link', key: 'antiLink' },
    'antispam': { label: 'Anti Spam', key: 'antiSpam' },
    'antitoxic': { label: 'Anti Kata Kasar', key: 'antiToxic' },
    'nsfw': { label: 'NSFW Group Content', key: 'nsfw' },
    'game': { label: 'Game di Grup', key: 'gameEnabled' },
    'mute': { label: 'Mute Bot (owner only)', key: 'muted' },
};

function renderToggleListNumbered(title, toggles, currentValues, startNumber) {
    let text = `╭─❍❁『 *${title}* 』❁❍\n`;
    const entries = [];
    let i = startNumber;
    for (const [cmd, meta] of Object.entries(toggles)) {
        const isOn = currentValues[meta.key];
        const badge = isOn ? config.theme.on : config.theme.off;
        text += `│ *${i}.* ${badge} ${meta.label}\n`;
        entries.push({ cmdKey: cmd });
        i++;
    }
    text += `╰────────────────`;
    return { text, entries };
}

module.exports = {
    command: ['toggle', 'settings'],
    category: 'owner',
    description: 'Menampilkan dan mengatur toggle fitur bot (reply angka untuk switch cepat)',
    limitCost: 0,
    execute: async (msg, { sock, jid, args, isGroup, isOwner }) => {
        const target = (args[0] || '').toLowerCase();

        // Tanpa argumen -> tampilkan daftar toggle bernomor
        if (!target) {
            const globalResult = renderToggleListNumbered('GLOBAL TOGGLE (Owner Only)', GLOBAL_TOGGLES, config.features, 1);
            let fullText = globalResult.text;
            let allEntries = globalResult.entries.map(e => ({ ...e, scope: 'global' }));

            if (isGroup) {
                const groupData = groupModel.getGroup(jid);
                const groupResult = renderToggleListNumbered('GROUP TOGGLE (Admin)', GROUP_TOGGLES, groupData, allEntries.length + 1);
                fullText += '\n\n' + groupResult.text;
                allEntries = allEntries.concat(groupResult.entries.map(e => ({ ...e, scope: 'group' })));
            }

            fullText += `\n\n_💬 Balas dengan angka untuk toggle ON/OFF langsung, atau ketik ${config.prefix[0]}toggle <nama>_`;

            navSession.registerSession('toggle', jid, { entries: allEntries, expiresAt: Date.now() + TOGGLE_SESSION_TTL });

            return sock.sendMessage(jid, { text: fullText }, { quoted: msg });
        }

        // ===== GLOBAL TOGGLE (owner only) =====
        if (GLOBAL_TOGGLES[target]) {
            if (!isOwner) {
                return sock.sendMessage(jid, { text: '🚫 Toggle global hanya bisa diubah oleh owner bot.' }, { quoted: msg });
            }
            const meta = GLOBAL_TOGGLES[target];
            config.features[meta.key] = !config.features[meta.key];
            const status = config.features[meta.key] ? 'DIAKTIFKAN ✅' : 'DIMATIKAN ❌';
            return sock.sendMessage(jid, { text: `⚙️ *${meta.label}* telah ${status}` }, { quoted: msg });
        }

        // ===== GROUP TOGGLE (admin only, dicek di messageHandler lewat adminOnly) =====
        if (GROUP_TOGGLES[target]) {
            if (!isGroup) {
                return sock.sendMessage(jid, { text: '🚫 Toggle ini hanya berlaku di dalam grup.' }, { quoted: msg });
            }
            const meta = GROUP_TOGGLES[target];
            const newValue = groupModel.toggleSetting(jid, meta.key);
            const status = newValue ? 'DIAKTIFKAN ✅' : 'DIMATIKAN ❌';
            return sock.sendMessage(jid, { text: `⚙️ *${meta.label}* telah ${status} untuk grup ini.` }, { quoted: msg });
        }

        return sock.sendMessage(jid, { text: `❓ Toggle *${target}* tidak ditemukan. Ketik *.toggle* untuk lihat daftar lengkap.` }, { quoted: msg });
    },

    /**
     * Dipanggil dari nonCommandHandler untuk menangkap reply angka terhadap
     * daftar toggle yang sedang aktif. Return true jika berhasil ditangani.
     */
    _handleToggleNavigation: async (sock, msg, jid, body, ctx) => {
        const session = navSession.getSession('toggle', jid);
        if (!session) return false;
        if (Date.now() > session.expiresAt) {
            navSession.clearSession('toggle', jid);
            return false;
        }

        const choice = parseInt(body.trim());
        if (isNaN(choice) || choice < 1 || choice > session.entries.length) return false;

        const entry = session.entries[choice - 1];
        const { isOwner, isGroup } = ctx;

        if (entry.scope === 'global') {
            if (!isOwner) {
                await sock.sendMessage(jid, { text: '🚫 Toggle global hanya bisa diubah oleh owner bot.' }, { quoted: msg });
                return true;
            }
            const meta = GLOBAL_TOGGLES[entry.cmdKey];
            config.features[meta.key] = !config.features[meta.key];
            const status = config.features[meta.key] ? 'DIAKTIFKAN ✅' : 'DIMATIKAN ❌';
            await sock.sendMessage(jid, { text: `⚙️ *${meta.label}* telah ${status}` }, { quoted: msg });
        } else {
            if (!isGroup) {
                await sock.sendMessage(jid, { text: '🚫 Toggle ini hanya berlaku di dalam grup.' }, { quoted: msg });
                return true;
            }
            const meta = GROUP_TOGGLES[entry.cmdKey];
            const newValue = groupModel.toggleSetting(jid, meta.key);
            const status = newValue ? 'DIAKTIFKAN ✅' : 'DIMATIKAN ❌';
            await sock.sendMessage(jid, { text: `⚙️ *${meta.label}* telah ${status} untuk grup ini.` }, { quoted: msg });
        }

        navSession.clearSession('toggle', jid);
        return true;
    },
};
