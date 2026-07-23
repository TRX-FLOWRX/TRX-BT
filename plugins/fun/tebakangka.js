// Menyimpan sesi game tebak angka per-jid
const activeGames = new Map();

module.exports = {
    command: ['tebakangka', 'guessnumber'],
    category: 'fun',
    description: 'Game tebak angka 1-100',
    groupOnly: false,
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        if (activeGames.has(jid)) {
            return sock.sendMessage(jid, { text: '⚠️ Masih ada game berjalan di chat ini. Ketik jawabanmu langsung, atau *.tebakangka stop* untuk mengakhiri.' }, { quoted: msg });
        }

        if (args[0] === 'stop') {
            activeGames.delete(jid);
            return sock.sendMessage(jid, { text: '🛑 Game dihentikan.' }, { quoted: msg });
        }

        const target = Math.floor(Math.random() * 100) + 1;
        activeGames.set(jid, { target, attempts: 0, maxAttempts: 7 });

        await sock.sendMessage(jid, {
            text: `🎯 *TEBAK ANGKA*\n\nAku memikirkan angka antara 1-100.\nKamu punya 7 kesempatan untuk menebak!\n\nKetik angka tebakanmu di chat ini.`
        }, { quoted: msg });
    },
    // Expose untuk dipakai nonCommandHandler jika ingin diproses sebagai jawaban game
    _activeGames: activeGames,
};
