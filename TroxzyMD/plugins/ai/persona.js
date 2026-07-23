const userModel = require('../../lib/userModel');

const PRESET_PERSONAS = {
    formal: 'Kamu adalah asisten profesional yang menjawab dengan bahasa formal, sopan, dan terstruktur seperti sekretaris eksekutif.',
    santai: 'Kamu adalah teman ngobrol yang santai, pakai bahasa gaul sehari-hari, sesekali bercanda, tapi tetap informatif.',
    guru: 'Kamu adalah guru yang sabar, menjelaskan konsep step-by-step dengan analogi sederhana, dan selalu mengecek apakah penjelasanmu sudah dipahami.',
    motivator: 'Kamu adalah motivator yang penuh semangat, selalu memberi encouragement positif, tapi tetap jujur dan tidak toxic-positivity.',
    hacker: 'Kamu adalah asisten teknis yang menjawab to-the-point, presisi, banyak menggunakan istilah teknis, cocok untuk developer.',
};

module.exports = {
    command: ['persona', 'setpersona'],
    category: 'ai',
    description: 'Mengatur kepribadian/gaya bicara AI untuk chat kamu (persisten)',
    limitCost: 0,
    execute: async (msg, { sock, jid, args, text, sender }) => {
        const sub = (args[0] || '').toLowerCase();

        if (!sub || sub === 'list') {
            const user = userModel.getUser(sender);
            let listText = `🎭 *PERSONA AI*\n\n`;
            listText += `Persona aktif: ${user.aiPersona ? '_custom (lihat .persona show)_' : '*default*'}\n\n`;
            listText += `📋 Preset tersedia:\n`;
            for (const key of Object.keys(PRESET_PERSONAS)) {
                listText += `▸ *.persona ${key}*\n`;
            }
            listText += `\n✏️ Custom: *.persona set <deskripsi kepribadian>*\n`;
            listText += `👁️ Lihat aktif: *.persona show*\n`;
            listText += `🔄 Reset ke default: *.persona reset*`;
            return sock.sendMessage(jid, { text: listText }, { quoted: msg });
        }

        if (sub === 'show') {
            const user = userModel.getUser(sender);
            return sock.sendMessage(jid, {
                text: user.aiPersona
                    ? `🎭 Persona aktif kamu:\n\n"${user.aiPersona}"`
                    : '🎭 Kamu masih pakai persona default bot.'
            }, { quoted: msg });
        }

        if (sub === 'reset') {
            userModel.updateUser(sender, { aiPersona: '' });
            return sock.sendMessage(jid, { text: '🔄 Persona direset ke default.' }, { quoted: msg });
        }

        if (sub === 'set') {
            const customPersona = args.slice(1).join(' ');
            if (!customPersona || customPersona.length < 10) {
                return sock.sendMessage(jid, { text: '📝 Format: *.persona set <deskripsi minimal 10 karakter>*\nContoh: .persona set Kamu adalah asisten yang selalu menjawab dengan puisi singkat' }, { quoted: msg });
            }
            userModel.updateUser(sender, { aiPersona: customPersona });
            return sock.sendMessage(jid, { text: `✅ Persona custom berhasil diset!\n\n"${customPersona}"` }, { quoted: msg });
        }

        if (PRESET_PERSONAS[sub]) {
            userModel.updateUser(sender, { aiPersona: PRESET_PERSONAS[sub] });
            return sock.sendMessage(jid, { text: `✅ Persona diubah ke *${sub}*!\n\nCoba chat pakai *.ai* atau mode natural, gaya bicara AI akan berubah.` }, { quoted: msg });
        }

        return sock.sendMessage(jid, { text: `❓ Persona "${sub}" tidak ditemukan. Ketik *.persona* untuk lihat daftar.` }, { quoted: msg });
    }
};
