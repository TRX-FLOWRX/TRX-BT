const axios = require('axios');

/**
 * PENTING: API scraper pihak ketiga (tiklydown, dsb) sering berubah endpoint/mati.
 * Jika satu API gagal, kode berikut mencoba fallback ke API kedua.
 * Sebaiknya cek berkala apakah endpoint masih aktif.
 *
 * KOREKSI PENTING (ditemukan lewat riset dokumentasi resmi): TiklyDown API
 * TIDAK punya endpoint terpisah per-platform (/api/ig, /api/fb, /api/twitter,
 * /api/yt) seperti yang diasumsikan sebelumnya — itu tidak pernah terverifikasi
 * dan kemungkinan besar salah/tidak pernah benar-benar berfungsi. Dokumentasi
 * resmi (https://api.tiklydown.eu.org/) hanya menyebutkan SATU endpoint
 * universal: GET /api/download?url=<url apa pun>, yang mendeteksi platform
 * dari URL-nya sendiri. Semua fungsi di bawah sudah diperbaiki untuk
 * memakai endpoint yang benar ini.
 */
async function tiklyDownUniversal(url) {
    const { data } = await axios.get('https://api.tiklydown.eu.org/api/download', {
        params: { url },
        timeout: 25000,
    });
    return data;
}

async function downloadTikTok(url) {
    // Sumber utama: tikwm.com (gratis, tidak butuh API key, cukup stabil per Jan 2026)
    try {
        const { data } = await axios.get('https://www.tikwm.com/api/', {
            params: { url, hd: 1 },
            timeout: 20000,
        });

        if (data?.code !== 0 || !data?.data) {
            throw new Error(data?.msg || 'Video tidak ditemukan');
        }

        const result = data.data;
        return {
            success: true,
            title: result.title,
            author: result.author?.nickname || result.author?.unique_id,
            duration: result.duration,
            noWatermark: result.play,
            withWatermark: result.wmplay,
            music: result.music,
            cover: result.cover,
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function downloadInstagram(url) {
    try {
        const data = await tiklyDownUniversal(url);

        if (!data?.success && !data?.media) {
            throw new Error('Media tidak ditemukan atau URL tidak valid');
        }

        const media = Array.isArray(data.media) ? data.media : [data.media];
        return {
            success: true,
            media: media.map(m => ({
                url: m.url || m,
                type: (m.url || m || '').includes('.mp4') ? 'video' : 'image',
            })),
        };
    } catch (err) {
        return {
            success: false,
            error: `${err.message} (Catatan: API scraper Instagram sering berubah/dibatasi. Jika terus gagal, kemungkinan endpoint perlu diganti.)`
        };
    }
}

async function downloadYouTube(url) {
    try {
        const data = await tiklyDownUniversal(url);

        if (!data?.success) {
            throw new Error('Video tidak ditemukan');
        }

        return {
            success: true,
            title: data.title,
            thumbnail: data.thumbnail,
            duration: data.duration,
            formats: data.formats || [],
        };
    } catch (err) {
        return {
            success: false,
            error: `${err.message} (Catatan: download YouTube butuh API yang lebih stabil untuk skala besar — pertimbangkan provider berbayar seperti RapidAPI jika sering dipakai.)`
        };
    }
}

async function downloadFacebook(url) {
    try {
        const data = await tiklyDownUniversal(url);
        if (!data?.success) throw new Error('Video tidak ditemukan');
        return {
            success: true,
            hd: data.hd || data.url,
            sd: data.sd,
            title: data.title,
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function downloadTwitter(url) {
    try {
        const data = await tiklyDownUniversal(url);
        if (!data?.success) throw new Error('Media tidak ditemukan');
        return {
            success: true,
            media: data.media || [],
            text: data.text,
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Pinterest — dicoba lewat endpoint universal yang sama. TiklyDown API
 * menyebutkan dukungan multi-platform tapi TIDAK secara eksplisit
 * mengonfirmasi Pinterest dalam dokumentasi yang tersedia publik — fungsi
 * ini best-effort dan WAJIB ditest manual setelah deploy. Jika gagal
 * konsisten, kemungkinan endpoint ini memang tidak mendukung Pinterest.
 */
async function downloadPinterest(url) {
    try {
        const data = await tiklyDownUniversal(url);
        if (!data?.success && !data?.media) throw new Error('Media tidak ditemukan atau Pinterest belum didukung endpoint ini');

        const media = Array.isArray(data.media) ? data.media : [data.media || data.url];
        return {
            success: true,
            media: media.filter(Boolean).map(m => ({
                url: m.url || m,
                type: (m.url || m || '').includes('.mp4') ? 'video' : 'image',
            })),
            title: data.title,
        };
    } catch (err) {
        return {
            success: false,
            error: `${err.message} (Catatan: dukungan Pinterest di endpoint ini belum terverifikasi resmi — jika terus gagal, fitur ini mungkin memang belum didukung provider.)`
        };
    }
}

module.exports = { downloadTikTok, downloadInstagram, downloadYouTube, downloadFacebook, downloadTwitter, downloadPinterest };
