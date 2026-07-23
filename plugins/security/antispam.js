const { isSpam } = require('../../lib/antispam');

module.exports = {
    command: ['antispam', 'cekspam'],
    category: 'security',
    description: 'Mengecek apakah pesan yang kamu kirim berpotensi spam berulang.',
    limitCost: 0,
    execute: async (msg, { sock, args, text, sender, jid }) => {
        const candidate = text.trim() || args.join(' ');
        if (!candidate) {
            return sock.sendMessage(jid, { text: '📝 Gunakan: *.antispam <teks>* untuk mengecek apakah teks tersebut berulang/monoton.' }, { quoted: msg });
        }

        const spamDetected = isSpam(sender, candidate);
        const response = spamDetected ? '⚠️ Pesan ini berpotensi spam karena sudah sering dikirim ulang dalam beberapa detik terakhir.' : '✅ Pesan ini terlihat normal dan tidak termasuk spam berulang.';
        await sock.sendMessage(jid, { text: response }, { quoted: msg });
    }
};
