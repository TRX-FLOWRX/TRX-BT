const axios = require('axios');

module.exports = {
    command: ['cuaca', 'weather'],
    category: 'tools',
    description: 'Cek cuaca berdasarkan nama kota',
    cooldown: 3,
    limitCost: 1,
    execute: async (msg, { sock, jid, text }) => {
        if (!text) {
            return sock.sendMessage(jid, { text: '📝 Format: *.cuaca <nama kota>*\nContoh: .cuaca Jakarta' }, { quoted: msg });
        }

        try {
            // Geocoding dulu untuk dapat koordinat
            const geoRes = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
                params: { name: text, count: 1 },
                timeout: 10000,
            });

            const location = geoRes.data?.results?.[0];
            if (!location) {
                return sock.sendMessage(jid, { text: `❌ Kota "${text}" tidak ditemukan.` }, { quoted: msg });
            }

            const weatherRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
                params: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
                    timezone: 'auto',
                },
                timeout: 10000,
            });

            const current = weatherRes.data.current;
            const weatherDesc = getWeatherDescription(current.weather_code);

            const text_result = `🌤️ *CUACA ${location.name.toUpperCase()}*\n\n`
                + `🌡️ Suhu: ${current.temperature_2m}°C\n`
                + `💧 Kelembapan: ${current.relative_humidity_2m}%\n`
                + `💨 Angin: ${current.wind_speed_10m} km/h\n`
                + `☁️ Kondisi: ${weatherDesc}\n\n`
                + `📍 ${location.name}, ${location.country || ''}`;

            await sock.sendMessage(jid, { text: text_result }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Gagal mengambil data cuaca.\nDetail: ${err.message}` }, { quoted: msg });
        }
    }
};

function getWeatherDescription(code) {
    const map = {
        0: 'Cerah', 1: 'Cerah Berawan', 2: 'Berawan Sebagian', 3: 'Mendung',
        45: 'Berkabut', 48: 'Berkabut Tebal',
        51: 'Gerimis Ringan', 53: 'Gerimis', 55: 'Gerimis Lebat',
        61: 'Hujan Ringan', 63: 'Hujan', 65: 'Hujan Lebat',
        80: 'Hujan Deras', 95: 'Badai Petir',
    };
    return map[code] || 'Tidak diketahui';
}
