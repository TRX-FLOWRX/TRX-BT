const userModel = require('../../lib/userModel');
const config = require('../../config/config');

module.exports = {
    command: ['referral', 'ref'],
    category: 'tools',
    description: 'Cek kode referral dan statistik referral kamu',
    limitCost: 0,
    execute: async (msg, { sock, jid, sender }) => {
        const user = userModel.getUser(sender);

        const text = `╭─❍❁『 *REFERRAL KAMU* 』❁❍\n`
            + `│ 🔑 Kode Referral : ${user.referralCode}\n`
            + `│ 👥 Total Berhasil: ${user.referralCount} orang\n`
            + `│ 💰 Total Earnings: Rp${user.referralEarnings.toLocaleString('id-ID')}\n`
            + `╰────────────────\n\n`
            + `📢 *Cara kerja:*\n`
            + `Bagikan kode referral kamu ke teman. Saat mereka registrasi pakai kode kamu (*.register nama|${user.referralCode}*) DAN berhasil diverifikasi channel, kamu otomatis dapat *Rp${userModel.REFERRAL_REWARD.toLocaleString('id-ID')}*.\n\n`
            + `💡 Reward masuk ke balance kamu, cek dengan *.profile*`;

        await sock.sendMessage(jid, { text }, { quoted: msg });
    }
};
