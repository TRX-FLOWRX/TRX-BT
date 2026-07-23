export default {
  name: 'tebakgambar',
  command: 'tebakgambar',
  category: 'games',
  description: 'Simple tebak gambar game skeleton',
  execute: async ({ sendMessage, jid }) => {
    await sendMessage(jid, 'Game tebak gambar: sebutkan jawaban dari gambar ini. [placeholder]');
  }
};
