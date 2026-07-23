module.exports = {
    command: ['suit', 'batugunting'],
    category: 'fun',
    description: 'Main batu-gunting-kertas melawan bot',
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const choice = (args[0] || '').toLowerCase();
        const validChoices = ['batu', 'gunting', 'kertas'];

        if (!validChoices.includes(choice)) {
            return sock.sendMessage(jid, { text: '📝 Format: *.suit <batu/gunting/kertas>*\nContoh: .suit batu' }, { quoted: msg });
        }

        const botChoice = validChoices[Math.floor(Math.random() * 3)];

        let result;
        if (choice === botChoice) {
            result = 'SERI 🤝';
        } else if (
            (choice === 'batu' && botChoice === 'gunting') ||
            (choice === 'gunting' && botChoice === 'kertas') ||
            (choice === 'kertas' && botChoice === 'batu')
        ) {
            result = 'KAMU MENANG! 🎉';
        } else {
            result = 'BOT MENANG! 🤖';
        }

        const emoji = { batu: '🪨', gunting: '✂️', kertas: '📄' };

        await sock.sendMessage(jid, {
            text: `${emoji[choice]} vs ${emoji[botChoice]}\n\nKamu: ${choice}\nBot: ${botChoice}\n\n*${result}*`
        }, { quoted: msg });
    }
};
