const db = require('./database');

function generateTrxId() {
    return 'TRX' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function createTransaction(buyerJid, packageName, basePrice) {
    const trxId = generateTrxId();
    // Nominal unik ditambahkan 3 digit terakhir supaya owner bisa cocokkan mutasi mana yang mana
    const uniqueCode = Math.floor(Math.random() * 899) + 100; // 100-999
    const totalPrice = basePrice + uniqueCode;

    const transaction = {
        id: trxId,
        buyerJid,
        packageName,
        basePrice,
        uniqueCode,
        totalPrice,
        status: 'pending', // pending | confirmed | rejected | expired
        createdAt: Date.now(),
        confirmedAt: null,
        confirmedBy: null,
    };

    db.transactions.set(trxId, transaction);
    return transaction;
}

function getTransaction(trxId) {
    return db.transactions.get(trxId);
}

function getPendingByUser(jid) {
    const all = db.transactions.getAll();
    return Object.values(all).filter(t => t.buyerJid === jid && t.status === 'pending');
}

function confirmTransaction(trxId, confirmedBy) {
    return db.transactions.update(trxId, {
        status: 'confirmed',
        confirmedAt: Date.now(),
        confirmedBy,
    });
}

function rejectTransaction(trxId, reason) {
    return db.transactions.update(trxId, {
        status: 'rejected',
        confirmedAt: Date.now(),
        rejectReason: reason,
    });
}

function getAllPending() {
    const all = db.transactions.getAll();
    return Object.values(all).filter(t => t.status === 'pending');
}

module.exports = {
    createTransaction,
    getTransaction,
    getPendingByUser,
    confirmTransaction,
    rejectTransaction,
    getAllPending,
};
