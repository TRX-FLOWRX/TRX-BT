const sqlite = require('./sqlite');

function recordBattle(userId, game, status, details = {}) {
  const stmt = sqlite.db.prepare('INSERT INTO battle_stats (user_id, game, status, details, created_at) VALUES (?, ?, ?, ?, ?)');
  return stmt.run(userId, game, status, JSON.stringify(details), Date.now());
}

function getStats(userId) {
  const row = sqlite.db.prepare('SELECT wins, losses, draws, total FROM battle_stats WHERE user_id = ?').get(userId);
  return row || { wins: 0, losses: 0, draws: 0, total: 0 };
}

function buildLeaderboard(limit = 10) {
  return sqlite.db.prepare('SELECT user_id, wins, losses, draws, total FROM battle_stats ORDER BY wins DESC, total DESC LIMIT ?').all(limit);
}

module.exports = { recordBattle, getStats, buildLeaderboard };
