const sqlite = require('./sqlite');
const { sendMessageSafely } = require('./messageSender');
const logger = require('./logger');

let reminderInterval = null;

function loadReminders(sock) {
  if (reminderInterval) return;
  reminderInterval = setInterval(async () => {
    const now = Date.now();
    const stmt = sqlite.prepare('SELECT * FROM reminders WHERE remind_at <= ? AND sent = 0');
    const reminders = stmt.all(now);
    for (const reminder of reminders) {
      try {
        await sendMessageSafely(sock, reminder.jid, { text: `⏰ Reminder: ${reminder.message}` });
        sqlite.prepare('UPDATE reminders SET sent = 1 WHERE id = ?').run(reminder.id);
      } catch (err) {
        logger.error({ err, reminder }, 'Gagal mengirim reminder');
      }
    }
  }, 30000);
  reminderInterval.unref();
}

function createReminder({ jid, message, remind_at }) {
  const stmt = sqlite.prepare('INSERT INTO reminders (jid, message, remind_at, created_at, sent) VALUES (?, ?, ?, ?, 0)');
  const result = stmt.run(jid, message, remind_at, Date.now());
  return result.lastInsertRowid;
}

module.exports = { loadReminders, createReminder };
