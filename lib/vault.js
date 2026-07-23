const sqlite = require('./sqlite');

function deposit(userId, amount) {
  const stmt = sqlite.db.prepare('INSERT INTO vault (user_id, balance) VALUES (?, ?)');
  return stmt.run(userId, amount);
}

function getBalance(userId) {
  const row = sqlite.db.prepare('SELECT balance FROM vault WHERE user_id = ?').get(userId);
  return row ? row.balance : 0;
}

function adjustBalance(userId, amount) {
  const current = getBalance(userId);
  if (current === 0) {
    return deposit(userId, amount);
  }
  return sqlite.db.prepare('UPDATE vault SET balance = ? WHERE user_id = ?').run(current + amount, userId);
}

module.exports = { deposit, getBalance, adjustBalance };
