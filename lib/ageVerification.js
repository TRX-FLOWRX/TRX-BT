const userModel = require('./userModel');
const sqlite = require('./sqlite');
const logger = require('./logger');

function isAgeVerified(jid) {
  const user = userModel.getUser(jid);
  return Boolean(user.isVerified18);
}

function getAgeStatus(jid) {
  const user = userModel.getUser(jid);
  if (user.isVerified18) {
    return 'verified';
  }
  return 'unverified';
}

function requestAgeVerification(jid, dob) {
  const timestamp = Date.now();
  const stmt = sqlite.prepare('INSERT OR REPLACE INTO age_verification_requests (jid, dob, status, requested_at) VALUES (?, ?, ?, ?)');
  stmt.run(jid, dob, 'pending', timestamp);
  return { success: true, message: 'Permintaan verifikasi usia telah dicatat. Tunggu approval admin.' };
}

function approveAgeVerification(jid) {
  const now = Date.now();
  userModel.updateUser(jid, { isVerified18: true, ageVerifiedAt: now });
  const stmt = sqlite.prepare('UPDATE age_verification_requests SET status = ?, verified_at = ? WHERE jid = ?');
  stmt.run('approved', now, jid);
  logger.info({ jid }, 'User age verification approved');
  return true;
}

function denyAgeVerification(jid, reason) {
  const stmt = sqlite.prepare('UPDATE age_verification_requests SET status = ?, verified_at = ? WHERE jid = ?');
  stmt.run('denied', Date.now(), jid);
  logger.info({ jid, reason }, 'User age verification denied');
  return true;
}

function checkAge(req, msg, sender) {
  const user = userModel.getUser(sender);
  if (!user.isVerified18) {
    throw new Error('Hanya user dengan verifikasi usia 18+ yang bisa menggunakan fitur ini. Ketik .verifyage --age 18 untuk memulai verifikasi.');
  }
  return true;
}

module.exports = { isAgeVerified, getAgeStatus, requestAgeVerification, approveAgeVerification, denyAgeVerification, checkAge };
