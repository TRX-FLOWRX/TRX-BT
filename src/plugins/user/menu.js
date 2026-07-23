export default {
  name: 'menu',
  command: 'menu',
  category: 'user',
  description: 'Display the main menu',
  execute: async ({ sendMessage, jid }) => {
    const text = `📋 MAIN MENU\n├── 🤖 AI Features\n├── 🎮 Games\n├── 📥 Downloader\n├── 🛠️ Tools\n├── 👤 Profile\n├── 💎 Premium\n├── ⚙️ Settings\n└── ❓ Help`;
    await sendMessage(jid, text);
  }
};
