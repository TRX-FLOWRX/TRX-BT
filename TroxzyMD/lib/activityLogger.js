const sqlite = require('./sqlite');

function logActivity(jid, category, action, details = '') {
  const stmt = sqlite.prepare('INSERT INTO activity_logs_all (jid, category, action, details, created_at) VALUES (?, ?, ?, ?, ?)');
  stmt.run(jid, category, action, details, Date.now());
}

module.exports = { logActivity };
