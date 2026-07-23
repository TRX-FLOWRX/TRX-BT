const cron = require('cron');
const sqlite = require('./sqlite');
const logger = require('./logger');
const { sendMessageSafely } = require('./messageSender');

const scheduledJobs = new Map();

function loadSchedules(sock) {
  const stmt = sqlite.prepare('SELECT * FROM schedules WHERE active = 1');
  const schedules = stmt.all();
  schedules.forEach(schedule => {
    try {
      addScheduleJob(sock, schedule);
    } catch (err) {
      logger.error({ err, schedule }, 'Gagal jadwalkan task');
    }
  });
}

function addScheduleJob(sock, schedule) {
  if (scheduledJobs.has(schedule.id)) {
    scheduledJobs.get(schedule.id).stop();
  }
  const task = new cron.CronJob(schedule.cron_expression, async () => {
    try {
      await sendMessageSafely(sock, schedule.target_jid, { text: schedule.message });
      sqlite.prepare('UPDATE schedules SET next_run = ? WHERE id = ?').run(Date.now(), schedule.id);
    } catch (err) {
      logger.error({ err, schedule }, 'Gagal kirim jadwal pesan');
    }
  }, null, true);
  scheduledJobs.set(schedule.id, task);
}

function removeScheduleJob(scheduleId) {
  const job = scheduledJobs.get(scheduleId);
  if (job) {
    job.stop();
    scheduledJobs.delete(scheduleId);
  }
}

function createSchedule({ target_jid, message, cron_expression }) {
  const now = Date.now();
  const stmt = sqlite.prepare('INSERT INTO schedules (target_jid, message, cron_expression, next_run, active, created_at) VALUES (?, ?, ?, ?, 1, ?)');
  const result = stmt.run(target_jid, message, cron_expression, now, now);
  return result.lastInsertRowid;
}

function deactivateSchedule(scheduleId) {
  sqlite.prepare('UPDATE schedules SET active = 0 WHERE id = ?').run(scheduleId);
  removeScheduleJob(scheduleId);
}

module.exports = { loadSchedules, addScheduleJob, removeScheduleJob, createSchedule, deactivateSchedule };
