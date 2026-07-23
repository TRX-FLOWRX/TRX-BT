module.exports = {
    command: ['groupinfo', 'infogrup'],
    category: 'group',
    description: 'Menampilkan informasi grup',
    groupOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid }) => {
        const metadata = await sock.groupMetadata(jid);
        const admins = metadata.participants.filter(p => p.admin);

        let text = `╭─❍❁『 *INFO GRUP* 』❁❍\n`;
        text += `│ 📛 Nama    : ${metadata.subject}\n`;
        text += `│ 🆔 ID      : ${metadata.id}\n`;
        text += `│ 👥 Member  : ${metadata.participants.length}\n`;
        text += `│ 👑 Admin   : ${admins.length}\n`;
        text += `│ 📝 Desc    : ${metadata.desc?.slice(0, 100) || '-'}\n`;
        text += `╰────────────────`;

        await sock.sendMessage(jid, { text }, { quoted: msg });
    }
};
