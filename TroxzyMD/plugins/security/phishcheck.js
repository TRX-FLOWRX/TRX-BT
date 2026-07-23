const { checkPhishing, checkBlacklist } = require('../../lib/phishCheck');

module.exports = {
    command: ['phishcheck', 'cekphish'],
    category: 'security',
    description: 'Mengecek apakah URL berpotensi phishing atau berbahaya.',
    limitCost: 0,
    execute: async (msg, { sock, args, jid }) => {
        const url = args[0];
        if (!url) {
            return sock.sendMessage(jid, { text: '📝 Gunakan: *.phishcheck <url>*' }, { quoted: msg });
        }

        const blacklistResult = checkBlacklist(url);
        if (blacklistResult) {
            return sock.sendMessage(jid, { text: `⚠️ URL ini dicurigai berbahaya karena cocok dengan blacklist internal.` }, { quoted: msg });
        }

        const result = await checkPhishing(url);
        if (result.safe === false) {
            return sock.sendMessage(jid, { text: `⚠️ Potensi phishing terdeteksi. Alasan: ${result.reason || 'tidak diketahui'}` }, { quoted: msg });
        }
        if (result.safe === null) {
            return sock.sendMessage(jid, { text: `✅ Tidak ada indikasi phishing dari API eksternal, tapi status belum pasti. Gunakan kehati-hatian.` }, { quoted: msg });
        }

        await sock.sendMessage(jid, { text: '✅ URL ini terlihat aman menurut pemeriksaan saat ini.' }, { quoted: msg });
    }
};
