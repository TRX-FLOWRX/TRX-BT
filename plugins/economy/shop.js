const userModel = require('../../lib/userModel');

const STORE_ITEMS = [
    { key: 'badge', name: 'Badge Premium', price: 15000, description: 'Mendapatkan badge VIP di menu profil.' },
    { key: 'limit', name: 'Extra Limit 1 Hari', price: 10000, description: 'Menambah 25 limit harian untuk satu hari.' },
    { key: 'xpboost', name: 'XP Boost', price: 8000, description: 'Meningkatkan XP tambahan +50 sekali pakai.' },
];

function formatCurrency(amount) {
    return `Rp${amount.toLocaleString('id-ID')}`;
}

module.exports = {
    command: ['shop', 'toko'],
    category: 'economy',
    description: 'Melihat daftar item shop dan membeli item.',
    limitCost: 0,
    execute: async (msg, { sock, args, sender, jid }) => {
        const sub = (args[0] || '').toLowerCase();
        const user = userModel.getUser(sender);

        if (!sub || sub === 'list') {
            let text = '🛒 *Daftar Item Shop*\n\n';
            STORE_ITEMS.forEach(item => {
                text += `• *${item.name}* (${item.key}) — ${formatCurrency(item.price)}\n  _${item.description}_\n`;
            });
            text += '\nGunakan *.shop buy <key>* untuk membeli item.';
            return sock.sendMessage(jid, { text }, { quoted: msg });
        }

        if (sub === 'buy') {
            const itemKey = args[1]?.toLowerCase();
            const item = STORE_ITEMS.find(i => i.key === itemKey);
            if (!item) {
                return sock.sendMessage(jid, { text: '❌ Item tidak ditemukan. Gunakan *.shop list* untuk melihat item yang tersedia.' }, { quoted: msg });
            }
            if (user.balance < item.price) {
                return sock.sendMessage(jid, { text: `❌ Saldo tidak cukup. Kamu butuh ${formatCurrency(item.price)}, sementara saldo kamu ${formatCurrency(user.balance)}.` }, { quoted: msg });
            }

            userModel.addBalance(sender, -item.price);
            let message = `✅ Berhasil membeli *${item.name}* seharga ${formatCurrency(item.price)}.`;
            if (item.key === 'limit') {
                userModel.updateUser(sender, { dailyLimit: user.dailyLimit + 25 });
                message += '\n📈 Limit harian kamu bertambah 25.';
            } else if (item.key === 'xpboost') {
                userModel.addXp(sender, 50);
                message += '\n✨ Kamu mendapatkan +50 XP tambahan.';
            }
            await sock.sendMessage(jid, { text: message }, { quoted: msg });
            return;
        }

        await sock.sendMessage(jid, { text: '📝 Gunakan: *.shop list* atau *.shop buy <key>*' }, { quoted: msg });
    }
};
