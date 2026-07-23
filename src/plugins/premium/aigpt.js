export default {
  name: 'aigpt',
  command: 'aigpt',
  category: 'premium',
  description: 'Ask AI assistant',
  execute: async ({ args, sendMessage }) => {
    const prompt = args.join(' ');
    if (!prompt) {
      await sendMessage(jid, 'Silakan berikan pertanyaan AI.');
      return;
    }
    await sendMessage(jid, 'Memproses permintaan AI...');
    await sendMessage(jid, `AI response: [placeholder]
(Integration aktif di src/services/aiService.js)`);
  }
};
