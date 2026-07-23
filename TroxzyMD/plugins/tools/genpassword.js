const crypto = require('crypto');

module.exports = {
    command: ['genpassword', 'password'],
    category: 'tools',
    description: 'Membuat password acak yang kuat',
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const length = parseInt(args[0]) || 16;
        const safeLength = Math.min(Math.max(length, 6), 64); // batasi 6-64 karakter

        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        const randomBytes = crypto.randomBytes(safeLength);
        for (let i = 0; i < safeLength; i++) {
            password += charset[randomBytes[i] % charset.length];
        }

        await sock.sendMessage(jid, {
            text: `🔐 *PASSWORD ACAK*\n\n\`\`\`${password}\`\`\`\n\n_Panjang: ${safeLength} karakter. Simpan baik-baik, pesan ini tidak disimpan bot._`
        }, { quoted: msg });
    }
};
