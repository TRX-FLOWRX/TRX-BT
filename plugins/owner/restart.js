module.exports = {
    command: ['restart'],
    category: 'owner',
    description: 'Merestart proses bot (owner only)',
    ownerOnly: true,
    limitCost: 0,
    execute: async (msg, { sock, jid }) => {
        await sock.sendMessage(jid, { text: '🔄 Bot sedang restart...' }, { quoted: msg });
        process.exit(0); // Pterodactyl akan otomatis restart proses jika 'Auto Restart' aktif di egg
    }
};
