async function sendMessageSafely(sock, jid, content, options = {}) {
  try {
    return await sock.sendMessage(jid, content, options);
  } catch (err) {
    console.error('[SEND MESSAGE ERROR]', err.message);
    return null;
  }
}

module.exports = { sendMessageSafely };
