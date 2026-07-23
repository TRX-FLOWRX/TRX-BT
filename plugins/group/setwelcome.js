const groupModel = require('../../lib/groupModel');

module.exports = {
    command: ['setwelcome', 'setgoodbye'],
    category: 'group',
    description: 'Mengatur pesan welcome/goodbye custom (gunakan @user dan @group sebagai placeholder)',
    groupOnly: true,
    adminOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid, text, command }) => {
        if (!text) {
            return sock.sendMessage(jid, {
                text: `📝 Format: *.${command} <pesan>*\n\nPlaceholder yang bisa dipakai:\n@user - mention member\n@group - nama grup\n\nContoh:\n.setwelcome Halo @user, selamat datang di @group!`
            }, { quoted: msg });
        }

        const key = command === 'setwelcome' ? 'customWelcomeMsg' : 'customGoodbyeMsg';
        groupModel.updateGroup(jid, { [key]: text });

        await sock.sendMessage(jid, { text: `✅ Pesan ${command === 'setwelcome' ? 'welcome' : 'goodbye'} berhasil diatur.` }, { quoted: msg });
    }
};
