export default {
  name: 'aicode',
  command: 'aicode',
  category: 'ai',
  description: 'Generate code using AI',
  execute: async ({ sendMessage, jid }) => {
    await sendMessage(jid, 'Fitur aicode sedang dalam pengembangan.');
  }
};
