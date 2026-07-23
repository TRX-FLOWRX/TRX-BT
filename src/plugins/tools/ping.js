export default {
  name: 'ping',
  command: 'ping',
  category: 'tools',
  description: 'Check latency',
  execute: async ({ sendMessage, jid }) => {
    await sendMessage(jid, 'Pong!');
  }
};
