export default {
  name: 'ytmp4',
  command: 'ytmp4',
  category: 'downloader',
  description: 'Download YouTube video (placeholder)',
  execute: async ({ sendMessage, jid }) => {
    await sendMessage(jid, 'Fitur ytmp4 sedang dalam pengembangan. Masukkan URL untuk memulai download.');
  }
};
