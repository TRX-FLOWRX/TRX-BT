const { askAI } = require('../../lib/aiClient');

const CODE_SYSTEM_PROMPT = `Kamu adalah asisten programming ahli. Ketika diberikan kode, kamu: (1) identifikasi bahasa pemrogramannya, (2) jelaskan apa yang dilakukan kode tersebut secara ringkas, (3) jika ada bug/error, tunjukkan lokasinya dan berikan perbaikan dengan code block, (4) beri saran perbaikan kualitas/best-practice jika relevan. Jawab dengan Bahasa Indonesia untuk penjelasan, tapi kode/variabel/nama fungsi tetap dalam bahasa aslinya. Gunakan code block markdown (tiga backtick) untuk semua kode.`;

module.exports = {
    command: ['debugcode', 'analisakode', 'fixcode'],
    category: 'ai',
    description: 'Analisa, jelaskan, atau debug kode menggunakan AI',
    cooldown: 5,
    limitCost: 2,
    execute: async (msg, { sock, jid, text, sender }) => {
        // Bisa dipakai dengan reply ke pesan yang berisi kode, atau langsung setelah command
        const quotedText = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
            || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;

        const codeToAnalyze = text || quotedText;

        if (!codeToAnalyze) {
            return sock.sendMessage(jid, {
                text: '💻 Format: *.debugcode <kode>* atau reply pesan berisi kode dengan caption *.debugcode*\n\nContoh:\n.debugcode function add(a, b) { retun a + b }'
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '💻', key: msg.key } });

        // GLM-5.2 dipilih khusus untuk task ini karena benchmark coding-nya kuat
        // dan context window 1M token bisa menangani snippet kode yang cukup besar.
        const result = await askAI(`debugcode_${sender}`, codeToAnalyze, CODE_SYSTEM_PROMPT, {
            skipHistory: true,
            maxTokens: 3000,
        });

        if (!result.success) {
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(jid, { text: result.error }, { quoted: msg });
        }

        await sock.sendMessage(jid, { text: result.reply }, { quoted: msg });
        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
    }
};
