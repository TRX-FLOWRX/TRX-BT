module.exports = {
    command: ['ceknomor', 'checknumber'],
    category: 'tools',
    description: 'Cek info dasar nomor HP (kode negara dan panjang)',
    limitCost: 0,
    execute: async (msg, { sock, jid, args }) => {
        const number = args[0]?.replace(/\D/g, '');
        if (!number) {
            return sock.sendMessage(jid, { text: '📝 Format: *.ceknomor <nomor>*\nContoh: .ceknomor 628123456789' }, { quoted: msg });
        }

        // Deteksi kode negara umum secara sederhana (tanpa library eksternal
        // yang bisa gagal-install, cukup untuk info dasar).
        const countryCodes = {
            '62': 'Indonesia', '60': 'Malaysia', '65': 'Singapura', '66': 'Thailand',
            '63': 'Filipina', '84': 'Vietnam', '855': 'Kamboja', '856': 'Laos',
            '95': 'Myanmar', '673': 'Brunei', '1': 'Amerika Serikat/Kanada',
            '44': 'Inggris', '91': 'India', '86': 'China', '81': 'Jepang', '82': 'Korea Selatan',
        };

        let detectedCountry = 'Tidak diketahui';
        for (const [code, country] of Object.entries(countryCodes)) {
            if (number.startsWith(code)) {
                detectedCountry = country;
                break;
            }
        }

        const text = `📱 *INFO NOMOR*\n\n`
            + `Nomor    : ${number}\n`
            + `Panjang  : ${number.length} digit\n`
            + `Negara   : ${detectedCountry} (deteksi kasar dari kode awal)\n\n`
            + `_Catatan: ini deteksi sederhana berdasar kode negara, bukan lookup operator/carrier real-time._`;

        await sock.sendMessage(jid, { text }, { quoted: msg });
    }
};
