const pool = require('../config/db');

const logarUsuario = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ mensagem: 'E-mail e senha são obrigatórios.' });
        }

        const [usuarios] = await pool.query('SELECT id, nome, email, senha, nivel_acesso FROM usuarios WHERE email = ?', [email]);

        if (usuarios.length === 0) {
            return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
        }

        const usuario = usuarios[0];

        if (usuario.senha !== senha) {
            return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
        }

        res.status(200).json({
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            nivel: usuario.nivel_acesso 
        });

    } catch (erro) {
        console.error('Erro no login:', erro);
        res.status(500).json({ mensagem: 'Erro interno no servidor ao tentar autenticar.' });
    }
};

module.exports = { logarUsuario };