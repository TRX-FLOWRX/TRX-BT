const userModel = require('../../lib/userModel');
const { recordBattle } = require('../../lib/battleStats');

const EMOJIS = ['🍒','🍋','🍉','⭐','🍇','🔔'];

function spin() {
    return EMOJIS[Math.floor(Math.random()*EMOJIS.length)];
}

module.exports = {
    command: ['slots','slot'],
    category: 'fun',
    description: 'Main mesin slot sederhana. Menang dapat hadiah koin.',
    cooldown: 10,
    limitCost: 1,
    execute: async (msg, { sock, sender, jid }) => {
        const reel = [spin(), spin(), spin()];
        const result = reel.join(' ');
        let text = `🎰 ${result}\n`;
        if (reel[0] === reel[1] && reel[1] === reel[2]) {
            const reward = 5000;
            userModel.addBalance(sender, reward);
            recordBattle(sender, 'slots', 'win', { reward });
            text += `🎉 Jackpot! Kamu menang Rp${reward.toLocaleString('id-ID')}!`;
        } else {
            recordBattle(sender, 'slots', 'loss', {});
            text += '😢 Coba lagi ya. Tidak ada kombinasi yang cocok.';
        }
        await sock.sendMessage(jid, { text }, { quoted: msg });
    }
};
