const fs = require('fs-extra');
const path = require('path');
const config = require('../config/config');

const PROMPTS_DIR = path.join(__dirname, '..', 'config', 'prompts');

// Cache supaya tidak baca file disk di setiap chat — di-invalidate manual
// lewat .reload atau otomatis kalau file berubah (mtime beda dari cache).
const promptCache = new Map(); // filename -> { content, mtime }

/**
 * Membaca file system prompt, memotong bagian catatan owner (semua teks
 * setelah baris "---" pertama), dan mengganti placeholder {{BOT_NAME}} /
 * {{OWNER_NAME}} dengan nilai dari config. Hasil di-cache berdasarkan waktu
 * modifikasi file, jadi owner bisa edit file lalu .reload tanpa restart bot.
 */
function loadSystemPrompt(filename = 'default_system_prompt.txt') {
    const filePath = path.join(PROMPTS_DIR, filename);

    try {
        const stat = fs.statSync(filePath);
        const cached = promptCache.get(filename);

        if (cached && cached.mtime === stat.mtimeMs) {
            return cached.content;
        }

        const raw = fs.readFileSync(filePath, 'utf-8');
        // Potong semua yang di bawah baris "---" pertama (catatan internal owner,
        // tidak boleh ikut terkirim ke AI sebagai instruksi).
        const withoutOwnerNotes = raw.split(/^---\s*$/m)[0].trim();

        const processed = withoutOwnerNotes
            .replace(/\{\{BOT_NAME\}\}/g, config.botName)
            .replace(/\{\{OWNER_NAME\}\}/g, config.ownerName);

        promptCache.set(filename, { content: processed, mtime: stat.mtimeMs });
        return processed;
    } catch (err) {
        console.error(`[SYSTEM PROMPT ERROR] Gagal baca ${filename}:`, err.message);
        // Fallback minimal supaya bot tetap bisa jawab meski file rusak/hilang,
        // daripada crash total.
        return `Kamu adalah asisten AI dari bot WhatsApp bernama ${config.botName}. Jawab dengan ramah dan jelas dalam Bahasa Indonesia.`;
    }
}

function clearPromptCache() {
    promptCache.clear();
}

module.exports = { loadSystemPrompt, clearPromptCache, PROMPTS_DIR };
