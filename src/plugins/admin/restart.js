export default {
  name: 'restart',
  command: 'restart',
  category: 'admin',
  description: 'Restart bot',
  execute: async ({ sendMessage, jid }) => {
    await sendMessage(jid, 'Bot akan direstart...');
    process.exit(0);
  }
};
