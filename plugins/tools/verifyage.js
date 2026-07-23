const ageVerification = require('../../lib/ageVerification');
const userModel = require('../../lib/userModel');

module.exports = {
    command: ['verifyage', 'ageverify'],
    category: 'tools',
    description: 'Memulai proses verifikasi usia 18+ (owner approval akan diperlukan)',
    limitCost: 0,
    execute: async (msg, { sock, jid, args, sender }) => {
        const age = parseInt(args[0]);
        if (isNaN(age) || age < 18) {
            return sock.sendMessage(jid, {
                text: '📝 Format: *.verifyage 18*\nContoh: *.verifyage 18' 
            }, { quoted: msg });
        }

        const user = userModel.getUser(sender);
        if (user.isVerified18) {
            return sock.sendMessage(jid, { text: '✅ Kamu sudah terverifikasi 18+.' }, { quoted: msg });
        }

        ageVerification.requestAgeVerification(sender, `${age}`);
        return sock.sendMessage(jid, { text: '✅ Permintaan verifikasi usia 18+ telah dicatat. Owner akan mengecek dan menyetujui jika valid.' }, { quoted: msg });
    }
};
