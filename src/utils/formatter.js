export function formatCommandList(commands) {
  return commands.map((cmd) => `- ${cmd}`).join('\n');
}

export function buildButtonList(menuTitle, options) {
  return `📋 ${menuTitle}\n${options.map((item, index) => `${index + 1}. ${item}`).join('\n')}`;
}
