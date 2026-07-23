const { checkBlacklist } = require('../../lib/phishCheck');

module.exports = {
    command: ['blockcheck', 'cekblock'],
    category: 'security',
    description: 'Mengecek apakah URL terindikasi spam atau blacklisted secara internal.',
    limitCost: 0,
    execute: async (msg, { sock, args, jid }) => {
        const url = args[0];
        if (!url) {
            return sock.sendMessage(jid, { text: '📝 Gunakan: *.blockcheck <url>*' }, { quoted: msg });
        }
        const blacklisted = checkBlacklist(url);
        await sock.sendMessage(jid, { text: blacklisted ? '⚠️ URL ini terindikasi berbahaya atau spam.' : '✅ URL ini tidak ada di blacklist internal kami.' }, { quoted: msg });
    }
};
