const recentMessages = new Map();

function registerMessage(jid, text) {
  const now = Date.now();
  const messages = recentMessages.get(jid) || [];
  messages.push({ text, time: now });
  const trimmed = messages.filter(entry => now - entry.time < 10000);
  recentMessages.set(jid, trimmed);
  return trimmed;
}

function isSpam(jid, text, { threshold = 3 } = {}) {
  const messages = registerMessage(jid, text);
  const normalized = text.trim().toLowerCase();
  const sameCount = messages.filter(entry => entry.text.trim().toLowerCase() === normalized).length;
  return sameCount >= threshold;
}

function clearSpamHistory(jid) {
  recentMessages.delete(jid);
}

module.exports = { registerMessage, isSpam, clearSpamHistory };
