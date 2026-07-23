module.exports = {
    command: ['jodoh', 'kecocokan'],
    category: 'fun',
    description: 'Cek persentase kecocokan (hiburan semata)',
    limitCost: 0,
    execute: async (msg, { sock, jid, args, sender }) => {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!mentioned) {
            return sock.sendMessage(jid, { text: '📝 Tag seseorang untuk cek kecocokan.\nContoh: .jodoh @user' }, { quoted: msg });
        }

        // Hash sederhana dari 2 nomor supaya hasilnya konsisten untuk pasangan yang sama
        const combined = [sender, mentioned].sort().join('');
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            hash = (hash << 5) - hash + combined.charCodeAt(i);
            hash |= 0;
        }
        const percentage = Math.abs(hash) % 101;

        const emoji = percentage > 80 ? '💕' : percentage > 50 ? '💛' : percentage > 20 ? '💔' : '🤡';

        await sock.sendMessage(jid, {
            text: `${emoji} *CEK KECOCOKAN*\n\n@${sender.split('@')[0]} + @${mentioned.split('@')[0]}\n\nHasil: *${percentage}%*\n\n_Hasil hanya untuk hiburan semata!_`,
            mentions: [sender, mentioned]
        }, { quoted: msg });
    }
};
