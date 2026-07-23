let sharp;
try {
    sharp = require('sharp');
} catch (err) {
    sharp = null;
    console.warn('[WARNING] sharp module unavailable:', err.message);
}
const webp = require('node-webpmux');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

/**
 * Membuat stiker WebP dari buffer gambar, lengkap dengan metadata EXIF
 * (pack name, author) tanpa bergantung pada library pihak ketiga yang
 * membawa dependency lama/vulnerable (axios/sharp/file-type versi lawas).
 */
async function imageToWebpSticker(inputBuffer, { pack = 'TroxzyMD', author = 'Troxzy' } = {}) {
    if (!sharp) {
        throw new Error('Sharp is not available. Install sharp to use sticker/image conversion commands.');
    }
    // Convert ke WebP 512x512 (standar ukuran stiker WhatsApp)
    const webpBuffer = await sharp(inputBuffer)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 70 })
        .toBuffer();

    return addExifToWebp(webpBuffer, { pack, author });
}

async function addExifToWebp(webpBuffer, { pack, author }) {
    const tmpDir = path.join(__dirname, '..', 'tmp');
    await fs.ensureDir(tmpDir);
    const tmpPath = path.join(tmpDir, `sticker_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.webp`);
    await fs.writeFile(tmpPath, webpBuffer);

    try {
        const img = new webp.Image();
        await img.load(tmpPath);

        const stickerId = crypto.randomBytes(8).toString('hex');
        const json = {
            'sticker-pack-id': stickerId,
            'sticker-pack-name': pack,
            'sticker-pack-publisher': author,
            'emojis': ['🤖'],
        };

        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
            0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
        ]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);

        img.exif = exif;
        await img.save(tmpPath);

        const finalBuffer = await fs.readFile(tmpPath);
        return finalBuffer;
    } finally {
        await fs.remove(tmpPath).catch(() => {});
    }
}

async function videoToWebpSticker(inputBuffer, { pack = 'TroxzyMD', author = 'Troxzy' } = {}) {
    if (!sharp) {
        throw new Error('Sharp is not available. Install sharp to use sticker/image conversion commands.');
    }
    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegPath = require('ffmpeg-static');
    ffmpeg.setFfmpegPath(ffmpegPath);

    const tmpDir = path.join(__dirname, '..', 'tmp');
    await fs.ensureDir(tmpDir);
    const inputPath = path.join(tmpDir, `in_${Date.now()}.mp4`);
    const outputPath = path.join(tmpDir, `out_${Date.now()}.webp`);

    await fs.writeFile(inputPath, inputBuffer);

    try {
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .outputOptions([
                    '-vcodec', 'libwebp',
                    '-vf', "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0",
                    '-loop', '0',
                    '-preset', 'default',
                    '-an',
                    '-vsync', '0',
                    '-t', '00:00:06', // max 6 detik sesuai batas WhatsApp
                ])
                .toFormat('webp')
                .on('end', resolve)
                .on('error', reject)
                .save(outputPath);
        });

        const webpBuffer = await fs.readFile(outputPath);
        return addExifToWebp(webpBuffer, { pack, author });
    } finally {
        await fs.remove(inputPath).catch(() => {});
        await fs.remove(outputPath).catch(() => {});
    }
}

module.exports = { imageToWebpSticker, videoToWebpSticker };
