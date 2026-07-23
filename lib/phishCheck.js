const axios = require('axios');

async function checkPhishing(url) {
  try {
    const response = await axios.post('https://phishcheck.xyz/api/check', { url }, { timeout: 15000 });
    if (response.data?.safe === false) {
      return { safe: false, reason: response.data.reason || 'Phishing terdeteksi' };
    }
    return { safe: true, info: response.data };
  } catch (err) {
    return { safe: null, error: 'API phishcheck gagal, menggunakan blacklist manual.' };
  }
}

function checkBlacklist(url) {
  const blacklist = [
    'bit.ly', 'tinyurl.com', 'shorte.st', 'adf.ly', 'rapidgator.net',
    'pornhub.com', 'xvideos.com', 'freefire' , 'slot', 'casino', 'poker'
  ];
  const normalized = url.toLowerCase();
  return blacklist.some(entry => normalized.includes(entry));
}

module.exports = { checkPhishing, checkBlacklist };
