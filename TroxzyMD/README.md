# 🤖 TroxzyMD - WhatsApp Multi Device Bot

Bot WhatsApp berbasis Baileys dengan sistem plugin modular, payment QRIS semi-otomatis, AI Chat lengkap (GLM-5.2, image generation, TTS, STT, vision), downloader multi-platform, sistem anti-blokir, dan banyak fitur lainnya.

**Status saat ini: 76 plugin aktif, 173 command siap pakai, 0 known vulnerabilities di dependency, menggunakan Baileys v7 (rc13).** (Angka ini akurat berdasarkan hasil test otomatis `loadPlugins()` dan `npm audit`, bukan estimasi.)

**Catatan soal jumlah fitur:** angka ini akan terus bertambah bertahap, dengan setiap command diuji satu-satu sebelum masuk. Project ini SENGAJA tidak mengejar target angka ribuan (2500+/3000+) karena command sebanyak itu — dalam skala waktu pengerjaan yang wajar — hampir pasti berisi duplikat, alias yang dihitung ganda, atau command yang tidak pernah benar-benar dites dan bisa error di pemakaian nyata. Bot WhatsApp populer berbasis Baileys yang dipakai luas di GitHub umumnya punya 100-300 command asli, bukan ribuan — proyek ini mengikuti standar itu demi kualitas.

---

## ⚠️ WAJIB DIBACA SEBELUM DEPLOY

1. **Bot ini pakai Baileys v7 (7.0.0-rc13), bukan v6.** Alasannya: panel hosting terbatas (seperti banyak provider Pterodactyl reseller) memblokir instalasi package via git protocol (`EALLOWLIST` error) yang dibutuhkan Baileys v6 untuk dependency `libsignal`. Baileys v7 memindahkan dependency itu sepenuhnya ke npm registry biasa, jadi tidak butuh akses git sama sekali saat `npm install`. Baileys v7 masih berstatus **release candidate** (belum versi stabil final) per pertengahan 2026, tapi rc13 sudah memperbaiki celah keamanan kritis yang ada di rc11 dan sebelumnya — **jangan downgrade ke rc11 atau lebih lama**.
2. **Ganti API key AI di `.env`** — jangan pernah simpan/share API key di tempat publik.
3. **Upload gambar QRIS kamu sendiri** ke `assets/qris.jpg` — belum ada file default karena ini data pribadi kamu.
4. **Isi `OWNER_NUMBER` di `.env`** dengan nomor WhatsApp kamu (format: `628xxxxxxxxxx`, tanpa `+` atau spasi).
5. Sistem payment ini **SEMI-OTOMATIS** — bukan payment gateway real-time. Alurnya: user `.buy` → transfer manual → user `.confirm` + kirim bukti → **kamu approve manual** lewat `.approve`. Ini karena QR yang kamu punya adalah QR statis Gopay biasa, bukan API merchant seperti Midtrans/Xendit yang bisa auto-verify.
6. **Endpoint downloader (TikTok/IG/YouTube/FB/Twitter/Pinterest) menggunakan API pihak ketiga gratis** yang sewaktu-waktu bisa berubah atau down. Selalu test manual setelah deploy, dan siap ganti endpoint di `lib/downloader.js` kalau ada yang error. **Perbaikan penting:** endpoint Instagram/YouTube/Facebook/Twitter sebelumnya salah memakai path per-platform (`/api/ig`, `/api/yt`, dst) yang ternyata tidak pernah terverifikasi ada di dokumentasi resmi TiklyDown — sudah diperbaiki untuk memakai endpoint universal `/api/download?url=` yang benar sesuai dokumentasi. Pinterest ditambahkan tapi dukungannya belum terkonfirmasi resmi, wajib ditest manual.
7. **Sticker maker dibuat sendiri** (`lib/stickerMaker.js`) menggunakan `sharp` + `node-webpmux`, bukan library pihak ketiga populer yang biasa dipakai bot WA lain — itu karena library tersebut menarik versi lama dari `axios`/`sharp`/`file-type` yang punya kerentanan keamanan (high severity). Kalau kamu menambahkan plugin custom yang butuh convert gambar/video ke stiker, pakai helper ini, jangan install ulang library sticker generik.
8. **Baileys v7 memperkenalkan sistem LID (Local Identifier)** menggantikan sebagian nomor telepon di beberapa grup/kontak untuk privasi. Kode owner-check di `lib/messageHandler.js` sudah menangani ini (cek baik `participant` maupun `participantAlt`), tapi kalau kamu menulis plugin custom yang membandingkan JID/nomor telepon secara manual, ingat bahwa `msg.key.participant` bisa saja berupa LID (`xxxx@lid`) bukan nomor asli (`xxxx@s.whatsapp.net`) — pakai `msg.key.participantAlt` sebagai fallback nomor asli jika dibutuhkan.
9. **Baileys v7 adalah paket ESM murni**, sedangkan seluruh kode bot ini tetap CommonJS. Ini ditangani lewat `lib/baileysHelper.js` yang melakukan dynamic `import()` di-cache — kalau kamu menulis plugin baru yang butuh fungsi Baileys selain yang sudah ada di `sock` (seperti `downloadContentFromMessage`), tambahkan fungsi itu ke `baileysHelper.js`, jangan `require('@whiskeysockets/baileys')` langsung karena itu akan error.

---

## 🧠 Sistem AI (GLM-5.2 via FreeTheAi)

Model utama untuk chat teks adalah **`glm/glm-5.2`** (context 1 juta token), sesuai permintaan — bukan varian `vova/` yang menurut catatan pemilik proyek suka dihapus provider. Fitur AI yang tersedia:

| Command | Fungsi | Catatan |
|---|---|---|
| `.ai <pertanyaan>` | Chat dengan GLM-5.2 | Auto-fallback ke model cadangan jika GLM kena rate limit 5-jam |
| `.aichat on/off` | Mode chat natural tanpa command | Aktif di private chat |
| `.persona` | Ganti kepribadian/gaya bicara AI | Persisten per-user, ada 5 preset + custom bebas |
| `.analisagambar` | Analisa gambar dengan AI vision | ⚠️ Lihat catatan vision di bawah |
| `.imagine <prompt>` | Generate gambar AI | Khusus premium (model `eve/gpt-image-2`) |
| `.tts <teks>` | Ubah teks jadi voice note AI | |
| `.tovoice` (reply voice note) | Transkrip voice note ke teks | |
| `.ringkas <url>` | Ringkas artikel/berita dari URL manapun | Fetch + AI, tidak terbatas situs tertentu |
| `.debugcode <kode>` | Analisa/debug/perbaiki kode | Dioptimalkan untuk kekuatan coding GLM-5.2 |
| `.setmodel` (owner) | Ganti model AI default on-the-fly | Tanpa perlu restart bot |

**⚠️ Catatan penting soal fitur vision (`.analisagambar`):** Berdasarkan katalog FreeTheAi per awal Juli 2026, **belum ada model vision non-`vova/`** yang terkonfirmasi mendukung analisa gambar. Default-nya masih memakai `vova/gemini-2.5-flash` untuk fitur ini SAJA (bukan untuk chat utama, yang sudah 100% GLM-5.2). Jika kamu tidak mau memakai vova sama sekali, set `AI_VISION_MODEL=disabled` di `.env` untuk mematikan fitur `.analisagambar` sampai ada alternatif — bot akan memberi pesan jelas ke user, bukan error membingungkan. Cek https://freetheai.xyz/models secara berkala untuk update.

**Rate limit provider:** FreeTheAi membatasi 250 request/hari per API key (reset UTC), dan API key perlu di-checkin harian oleh owner. Semua pesan error yang dikirim ke chat WhatsApp SENGAJA dibuat generik (misal "Layanan AI sedang sibuk") dan **tidak pernah menyebut nama provider/platform** — supaya user biasa tidak tahu dari mana API key kamu didapat. Detail teknis lengkap (kode error asli, nama provider, dll) tetap dicatat ke console log server lewat `console.error`, yang hanya bisa dilihat owner lewat panel Pterodactyl — bukan dikirim ke chat mana pun.

**Soal timeout AI ("timeout of Xms exceeded" / "lama nunggu baru pindah model"):** GLM (dan model besar sejenis lewat gateway gratis) dikonfirmasi dari banyak laporan komunitas independen sering lambat/timeout di jam sibuk. Strategi bot ini (per revisi terbaru): timeout diturunkan ke 25 detik per percobaan, dan begitu model utama (GLM) gagal — karena timeout, kuota habis, atau role-gated — bot **langsung** pindah ke model cadangan tanpa mengulang percobaan di model yang sama. Total waktu tunggu terburuk sekarang ~25-75 detik (tergantung apakah fallback juga bermasalah), jauh lebih cepat dari skema sebelumnya yang bisa sampai 2+ menit. Semua ini terjadi otomatis di belakang layar — user cuma melihat jawaban akhir (dengan catatan kecil jika dijawab model cadangan), tidak pernah melihat detail teknis error mentah.

**Soal GLM sering pindah ke model cadangan:** selain timeout, ada kemungkinan lain — FreeTheAi menerapkan role-gating untuk sebagian model (butuh role Discord `seems_legit`, didapat lewat aktivitas di server Discord mereka). Jika `glm/glm-5.2` di akun kamu ternyata role-gated dan kamu belum punya role itu, GLM akan selalu gagal dengan error `model_access_denied` — bot otomatis fallback ke model cadangan untuk kasus ini juga, tapi kalau kamu ingin GLM benar-benar jadi model utama yang konsisten (bukan sering fallback), cek status role kamu di Discord FreeTheAi.

---

## 🛡️ Sistem Anti-Blokir WhatsApp

**PENTING — baca ini dengan teliti:** Tidak ada kode yang membuat bot Baileys "kebal" dari blokir WhatsApp secara mutlak. WhatsApp mendeteksi pola pemakaian tidak wajar di sisi SERVER mereka, bukan sesuatu yang bisa "dikalahkan" dari sisi kode bot manapun — termasuk bot ini. Yang bot ini lakukan adalah **mengurangi risiko** dengan meniru pola pemakaian manusia dan mencegah kesalahan paling umum yang memicu blokir, BUKAN menjamin keamanan 100%.

Fitur yang aktif otomatis (lihat `lib/antiban.js`):
- **Delay & typing indicator natural** — semua balasan bot otomatis kena jeda 400ms-2.4 detik + status "mengetik..." sebelum terkirim, meniru waktu respon manusia, bukan instan seperti mesin
- **Rate limiter per-user** — maksimal 15 command/menit per user (lintas semua command), mencegah 1 orang memicu pola spam
- **Anti-flood detection** — jika 1 kontak mengirim ≥8 pesan dalam 10 detik, bot berhenti merespon 60 detik (mencegah bot ikut "spam membalas" saat di-spam, yang justru bikin bot sendiri terlihat mencurigakan)
- **Broadcast throttling** — `.broadcast` butuh konfirmasi eksplisit, delay 2-4.5 detik antar pesan + jeda istirahat 15-30 detik tiap 20 pesan
- **Warm-up mode otomatis untuk nomor baru** — 7 hari pertama sejak bot pertama kali connect, limit harian user otomatis dikurangi bertahap (20% → 50% → 80% → 100%), mengurangi risiko pada nomor yang belum "matang"

Yang **TIDAK** bisa dicegah kode ini (harus kamu hindari sendiri sebagai pemakai):
- Broadcast ke ratusan nomor asing yang tidak pernah interaksi dengan bot (di luar delay yang sudah otomatis, ini soal SIAPA target broadcast-nya)
- Bot dipakai publik oleh ratusan orang tak dikenal sekaligus dari 1 nomor sejak hari pertama
- Auto-reply berlebihan ke grup yang isinya sesama bot lain

---

## 📝 System Prompt AI (bisa diedit terpisah)

System prompt default untuk `.ai` disimpan di `config/prompts/default_system_prompt.txt` — file teks biasa, **bukan** hardcoded di kode. Edit file itu langsung sesuai keinginan (tambah kepribadian, gaya bicara, batasan topik, dll), lalu jalankan `.reload` di bot untuk langsung menerapkan perubahan tanpa restart. Placeholder `{{BOT_NAME}}` dan `{{OWNER_NAME}}` otomatis diganti nilai dari `.env`. Semua teks di bawah baris `---` di file itu adalah catatan internal untuk owner dan **tidak** ikut terkirim ke AI.

Ini terpisah dari `.persona` — system prompt default berlaku untuk semua user yang belum set persona custom; `.persona` adalah override per-user yang lebih spesifik.

## 💳 Payment Otomatis (Midtrans, opsional)

Selain sistem manual (QR statis + approve owner) yang sudah ada sejak awal, sekarang tersedia jalur **otomatis** lewat Midtrans SNAP API — pembayaran langsung diverifikasi dan premium aktif otomatis, tanpa perlu kirim bukti/approve manual.

**Cara aktifkan:**
1. Daftar akun di https://midtrans.com (individu cukup KTP, gratis)
2. Ambil Server Key dari dashboard Midtrans (Settings > Access Keys)
3. Isi `MIDTRANS_SERVER_KEY` di `.env`
4. Set webhook URL di dashboard Midtrans (Settings > Configuration > Payment Notification URL) mengarah ke `https://domain-server-kamu.com/webhook/midtrans`
5. Restart bot

**Selama belum diisi (placeholder), sistem otomatis fallback ke pembayaran manual seperti biasa** — tidak ada downtime atau bug kalau kamu belum sempat setup ini. Default mode adalah **sandbox** (`MIDTRANS_IS_PRODUCTION=false`), wajib testing dulu di sandbox sebelum ganti ke production dengan uang asli.

**Bug yang sudah diperbaiki:** field `url` di dalam response `actions` Midtrans (untuk `generate-qr-code`) bukan link gambar langsung — itu endpoint API terpisah yang harus di-`GET` untuk mendapat gambar QR asli. Kode versi awal salah asumsi field itu bisa langsung dipakai sebagai `image: { url }`, yang menyebabkan crash `Cannot read properties of undefined` di beberapa kondisi (terutama kalau response Midtrans tidak menyertakan `actions` sama sekali, misalnya karena channel QRIS belum aktif penuh di akun Midtrans kamu). Sekarang kode benar-benar fetch gambar dari endpoint action tersebut, dan jika gagal/tidak lengkap, otomatis fallback ke sistem manual dengan pesan error yang jelas — tidak pernah crash.

## 🩺 Diagnostic Tools (Owner)

- **`.aidiag`** — cek koneksi API AI secara detail: apakah API key valid, model tersedia, dan test actual chat completion dengan timing asli. Gunakan ini SEBELUM melaporkan "AI error" — hasilnya kasih bukti konkret (status HTTP, error type asli) yang jauh lebih membantu untuk debugging daripada laporan "gagal terus".
- **`.sessioninfo`** — cek status koneksi WhatsApp dan info sesi, membantu diagnosis masalah pairing/koneksi.

---

## 📋 Persiapan Sebelum Deploy

- Panel Pterodactyl dengan **Egg NodeJS** (support Node 20-24, sudah ditest di Node 22)
- Nomor WhatsApp aktif khusus untuk bot (disarankan bukan nomor pribadi utama)
- API key dari `freetheai.xyz` (atau provider AI lain yang kompatibel format OpenAI)

---

## 🚀 Instalasi di Pterodactyl

### 1. Upload File
Extract file zip ini ke root directory server Pterodactyl kamu (lewat File Manager atau SFTP).

### 2. Set Startup Command
Di tab **Startup**, pastikan:
```
Startup Command: node index.js
```

### 3. Isi Environment Variable
Edit file `.env` (buat baru jika belum ada, copy dari `.env.example` jika disediakan terpisah), isi minimal:
```env
OWNER_NUMBER=628xxxxxxxxxx
AI_API_KEY=key_ai_kamu_yang_baru
SESSION_METHOD=pairing
```

### 4. Install Dependency
Buka **Console**, jalankan:
```bash
npm install
```
Tunggu sampai selesai (biasanya 1-3 menit).

### 5. Upload QRIS
Upload gambar QR code Gopay/QRIS kamu ke folder `assets/`, beri nama `qris.jpg`.

### 6. Jalankan Bot
Klik tombol **Start** di panel. Bot akan meminta nomor WhatsApp di console:
```
Masukkan nomor WhatsApp bot (contoh 628xxxxxxxxxx):
```
Ketik nomor bot kamu, lalu tekan Enter. Bot akan menampilkan **kode pairing 8 digit**.

### 7. Hubungkan ke WhatsApp
Di HP kamu:
1. Buka WhatsApp
2. Masuk ke **Pengaturan > Perangkat Tertaut**
3. Tap **"Tautkan dengan nomor telepon"**
4. Masukkan kode pairing yang muncul di console

Setelah berhasil, bot akan menampilkan pesan "Berhasil terhubung!" dan siap digunakan.

> **Catatan:** Jika console Pterodactyl kamu tidak mendukung input interaktif (jarang terjadi tapi mungkin di beberapa provider), ubah `SESSION_METHOD=qr` di `.env` dan gunakan QR code alih-alih pairing code.

---

## 📱 Cara Pakai (User)

| Command | Fungsi |
|---|---|
| `.menu` | Menu cepat (command populer saja) |
| `.allmenu` | SEMUA command, dikelompokkan per kategori (interaktif) |
| `.ai <pertanyaan>` | Chat dengan AI (GLM-5.2) |
| `.persona` | Ganti gaya bicara AI sesuai selera |
| `.imagine <prompt>` | Generate gambar AI (premium) |
| `.tts <teks>` | Ubah teks jadi voice note AI |
| `.ringkas <url>` | Ringkas artikel dari link manapun |
| `.tiktok <link>` | Download video TikTok |
| `.ig <link>` | Download post/reels Instagram |
| `.ytmp4 <link>` / `.ytmp3 <link>` | Download YouTube video/audio |
| `.sticker` (reply gambar/video) | Buat stiker |
| `.buy <paket>` | Beli premium via QRIS |
| `.profile` | Cek status akun kamu |
| `.webgen <deskripsi>` | Generate website (khusus premium) |
| `.daily` | Klaim reward harian |
| `.tukarlimit <jumlah>` | Tukar balance jadi limit bot (Rp1.000 = 10 limit) |
| `.toggle` | Lihat & atur fitur ON/OFF |

## 👑 Command Khusus Owner

> **Catatan:** `.approvechannel` dan `.rejectchannel` sekarang menerima nomor dalam format apa pun (dengan `+`, spasi, atau strip — semua dibersihkan otomatis). Jika user yang dimaksud belum pernah kirim pesan apa pun ke bot (belum pernah `.register` atau interaksi lain), command akan memberi tahu itu secara eksplisit ("belum pernah terdaftar di database"), bukan pesan "format salah" yang membingungkan seperti sebelumnya.

| Command | Fungsi |
|---|---|
| `.addpremium <nomor> <hari>` | Kasih premium manual ke user |
| `.approve <trx_id>` | Approve pembayaran user |
| `.reject <trx_id> <alasan>` | Tolak pembayaran user |
| `.ban` / `.unban` | Ban/unban user |
| `.broadcast <pesan>` | Kirim pesan ke semua user |
| `.stats` | Statistik pemakaian bot (termasuk status warm-up) |
| `.setmodel` | Ganti model AI default on-the-fly |
| `.aidiag` | Diagnostic koneksi API AI secara detail |
| `.sessioninfo` | Cek status koneksi WhatsApp untuk diagnosis |
| `.toggle selfmode` | Bot hanya respon owner (mode self) |
| `.restart` | Restart bot |
| `.reload` | Reload semua plugin tanpa restart |

---

## 🔧 Menambah Plugin Baru

Bot ini pakai sistem **auto-load plugin** — tinggal taruh file `.js` baru di folder `plugins/<kategori>/`, restart bot (atau `.reload`), otomatis terdeteksi. Format plugin:

```js
module.exports = {
    command: ['namacommand', 'alias1', 'alias2'],
    category: 'tools', // untuk grouping di menu
    description: 'Deskripsi singkat',
    premium: false,      // true = khusus premium
    ownerOnly: false,     // true = khusus owner
    groupOnly: false,     // true = hanya di grup
    privateOnly: false,   // true = hanya chat pribadi
    adminOnly: false,     // true = khusus admin grup
    cooldown: 0,          // detik cooldown
    limitCost: 1,         // berapa limit yang dipakai per penggunaan
    execute: async (msg, { sock, jid, args, text, sender, isGroup, isOwner, user }) => {
        // logic kamu di sini
        await sock.sendMessage(jid, { text: 'Halo!' }, { quoted: msg });
    }
};
```

---

## 🐛 Troubleshooting

**"npm error code EALLOWLIST" saat instalasi**
→ Ini seharusnya sudah tidak terjadi lagi di versi bot ini (sudah pakai Baileys v7 yang dependency-nya murni dari npm registry). Jika masih muncul, pastikan kamu memakai `package.json` dari versi bot ini (cek `@whiskeysockets/baileys` harus `^7.0.0-rc13` atau lebih baru, BUKAN versi 6.x), dan jalankan `rm -rf node_modules package-lock.json` lalu `npm install` ulang dari awal.

**"Out of memory" / container crash saat `npm install`**
→ Proses install melakukan compile native module (`sharp`) yang butuh RAM cukup besar sesaat. Jika terjadi di panel dengan RAM sangat terbatas (di bawah ~512MB), coba: (1) install satu per satu dependency berat dengan `npm install sharp` dulu baru `npm install` sisanya, atau (2) minta admin panel menaikkan alokasi RAM sementara khusus saat instalasi, lalu turunkan lagi setelah `node_modules` selesai terbentuk (karena setelah terinstall, menjalankan bot butuh RAM jauh lebih kecil daripada saat instalasi).

**Bot tidak connect / stuck di "Sedang menghubungkan..."**
→ Cek koneksi internet server, coba restart. Jika masih gagal, hapus folder `sessions/` dan scan ulang.

**Command downloader error "Gagal download"**
→ Endpoint API pihak ketiga mungkin sedang down. Cek `lib/downloader.js`, ganti endpoint jika perlu.

**Sticker gagal dibuat**
→ Pastikan `sharp` ter-install dengan benar (`npm install sharp` ulang jika perlu, kadang butuh rebuild native binding).

**"Cannot find module xxx"**
→ Jalankan `npm install` ulang, pastikan tidak ada koneksi terputus saat instalasi.

**Command AI (.ai, .imagine, .tts, dll) error "checkin diperlukan" atau sejenisnya**
→ API key FreeTheAi perlu di-checkin harian oleh pemilik akun (owner FreeTheAi, bukan owner bot) lewat Discord. Ini di luar kendali kode bot — cek dashboard/Discord FreeTheAi kamu.

**Command AI selalu balas "kuota GLM habis"**
→ GLM di FreeTheAi punya limit kuota gratis per 5 jam yang bisa habis di jam sibuk. Bot akan otomatis coba model cadangan (`AI_FALLBACK_MODEL` di `.env`), tapi jika itu juga gagal, tunggu beberapa jam atau upgrade akun FreeTheAi jika tersedia opsi berbayar.

**Bot terasa lambat membalas semua command (termasuk yang sederhana seperti .ping)**
→ Ini SEBAGIAN memang disengaja (lihat bagian Sistem Anti-Blokir) — delay natural + typing indicator otomatis aktif di semua balasan untuk mengurangi risiko blokir. Delay dasarnya kecil (400ms-2 detik), tapi jika terasa jauh lebih lambat dari itu, cek koneksi internet server ke WhatsApp, bukan cuma soal delay yang disengaja.

---

## 📞 Kontak

- Owner: **Troxzy**
- Telegram: **t.me/SoloBanNoTrash**

---

## ⚖️ Disclaimer

- Bot ini menggunakan WhatsApp secara tidak resmi (unofficial API via Baileys). Ada risiko banned dari WhatsApp jika melanggar ToS mereka (spam, broadcast berlebihan, dll). Gunakan dengan bijak.
- Fitur payment adalah alat bantu pencatatan transaksi, bukan payment gateway resmi. Pastikan kamu memverifikasi setiap pembayaran dengan teliti sebelum approve.
- Endpoint scraper (downloader) memakai API publik pihak ketiga di luar kendali developer bot ini — availability tidak dijamin 100%.
