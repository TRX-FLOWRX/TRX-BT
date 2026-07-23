const chalk = require('chalk');
const cfonts = require('cfonts');
const config = require('../config/config');

function printBanner() {
    console.clear();

    cfonts.say(config.botName.toUpperCase(), {
        font: 'block',
        align: 'center',
        colors: ['cyan', 'magenta'],
        background: 'transparent',
        letterSpacing: 1,
        lineHeight: 1,
        space: true,
        gradient: ['cyan', 'magenta'],
        independentGradient: false,
        transitionGradient: true,
    });

    const line = chalk.gray('─'.repeat(60));
    console.log(line);
    console.log(chalk.cyanBright(`  🤖  Bot Name     : `) + chalk.white(config.botName));
    console.log(chalk.cyanBright(`  👤  Owner        : `) + chalk.white(config.ownerName));
    console.log(chalk.cyanBright(`  ✈️   Telegram     : `) + chalk.white(config.telegramOwner));
    console.log(chalk.cyanBright(`  🌐  Public Mode   : `) + chalk.white(config.publicMode ? 'ON' : 'OFF (Self only)'));
    console.log(chalk.cyanBright(`  🔑  Login Method  : `) + chalk.white(config.sessionMethod));
    console.log(chalk.cyanBright(`  📦  Node Version  : `) + chalk.white(process.version));
    console.log(line);
    console.log(chalk.yellow(`  Sedang menghubungkan ke WhatsApp...\n`));
}

function printReady(number) {
    const line = chalk.gray('─'.repeat(60));
    console.log(line);
    console.log(chalk.greenBright(`  ✅  ${config.botName} berhasil terhubung!`));
    console.log(chalk.greenBright(`  📱  Nomor Bot     : `) + chalk.white(number));
    console.log(chalk.greenBright(`  ⏰  Waktu         : `) + chalk.white(new Date().toLocaleString('id-ID')));
    console.log(line + '\n');
}

module.exports = { printBanner, printReady };
