const groupMetaCache = new Map();
const CACHE_TTL = 60 * 1000; // 1 menit

async function getGroupMetadata(sock, jid) {
    const cached = groupMetaCache.get(jid);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
        return cached.data;
    }
    const data = await sock.groupMetadata(jid);
    groupMetaCache.set(jid, { data, time: Date.now() });
    return data;
}

async function isGroupAdmin(sock, jid, participant) {
    try {
        const metadata = await getGroupMetadata(sock, jid);
        const participantData = metadata.participants.find(p => p.id === participant);
        return participantData?.admin === 'admin' || participantData?.admin === 'superadmin';
    } catch (err) {
        return false;
    }
}

async function isBotGroupAdmin(sock, jid) {
    try {
        const metadata = await getGroupMetadata(sock, jid);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botParticipant = metadata.participants.find(p => p.id.includes(botId.split('@')[0]));
        return botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
    } catch (err) {
        return false;
    }
}

function clearGroupCache(jid) {
    groupMetaCache.delete(jid);
}

module.exports = { getGroupMetadata, isGroupAdmin, isBotGroupAdmin, clearGroupCache };
