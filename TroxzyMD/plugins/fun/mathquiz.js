function generateProblem() {
    const operators = ['+', '-', '*'];
    const op = operators[Math.floor(Math.random() * operators.length)];
    let a = Math.floor(Math.random() * 50) + 1;
    let b = Math.floor(Math.random() * 50) + 1;

    if (op === '*') {
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
    }

    let answer;
    switch (op) {
        case '+': answer = a + b; break;
        case '-': answer = a - b; break;
        case '*': answer = a * b; break;
    }

    return { question: `${a} ${op} ${b}`, answer };
}

module.exports = {
    command: ['mathquiz', 'kuismatematika'],
    category: 'fun',
    description: 'Kuis hitung cepat matematika',
    cooldown: 3,
    limitCost: 0,
    execute: async (msg, { sock, jid }) => {
        const problem = generateProblem();
        await sock.sendMessage(jid, {
            text: `🔢 *KUIS MATEMATIKA*\n\nBerapa hasil dari:\n*${problem.question}*\n\n_Jawaban: ${problem.answer}_\n\n(Kuis ini generate langsung dengan jawaban tampil untuk latihan mandiri)`
        }, { quoted: msg });
    }
};
