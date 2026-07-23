const config = require('../../config/config');

module.exports = {
    command: ['owner', 'creator'],
    category: 'tools',
    description: 'Menampilkan kontak owner bot',
    limitCost: 0,
    execute: async (msg, { sock, jid }) => {
        const text = `👤 *INFO OWNER*\n\n`
            + `📛 Nama     : ${config.ownerName}\n`
            + `✈️ Telegram : ${config.telegramOwner}\n\n`
            + `_Hubungi owner jika ada kendala teknis atau ingin upgrade premium secara langsung._`;

        await sock.sendMessage(jid, {
            contacts: {
                displayName: config.ownerName,
                contacts: [{
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${config.ownerName}\nORG:${config.botName};\nTEL;type=CELL;type=VOICE;waid=${config.ownerNumber}:+${config.ownerNumber}\nEND:VCARD`
                }]
            }
        }, { quoted: msg });

        await sock.sendMessage(jid, { text }, { quoted: msg });
    }
};
