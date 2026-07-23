const sqlite = require('./sqlite');

function joinQueue(userId, game, metadata = {}) {
  const stmt = sqlite.db.prepare('INSERT INTO match_queue (user_id, game, joined_at, metadata) VALUES (?, ?, ?, ?)');
  return stmt.run(userId, game, Date.now(), JSON.stringify(metadata));
}

function leaveQueue(userId, game) {
  return sqlite.db.prepare('DELETE FROM match_queue WHERE user_id = ? AND game = ?').run(userId, game);
}

function getQueue(game) {
  return sqlite.db.prepare('SELECT * FROM match_queue WHERE game = ? ORDER BY joined_at ASC').all(game);
}

module.exports = { joinQueue, leaveQueue, getQueue };
