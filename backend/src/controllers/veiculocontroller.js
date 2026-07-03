const pool = require('../config/db');

const listarVeiculos = async (req, res) => {
    try {
        const [veiculos] = await pool.query('SELECT * FROM veiculos');
        res.status(200).json(veiculos);
    } catch (erro) {
        console.error('Erro ao buscar veículos:', erro);
        res.status(500).json({ mensagem: 'Erro interno ao tentar buscar os veículos.' });
    }
};

const cadastrarVeiculo = async (req, res) => {
    try {
        const { marca, modelo, ano, placa, valor_diaria, status, img } = req.body; 

        const query = 'INSERT INTO veiculos (marca, modelo, ano, placa, valor_diaria, status, img) VALUES (?, ?, ?, ?, ?, ?, ?)';
        await pool.query(query, [marca, modelo, ano, placa, valor_diaria, status, img]);

        res.status(201).json({ mensagem: 'Veículo cadastrado com sucesso!' });
    } catch (erro) {
        console.error('Erro ao cadastrar veículo:', erro);
        res.status(500).json({ mensagem: 'Erro interno ao tentar cadastrar o veículo.' });
    }
};
const atualizarVeiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const { marca, modelo, ano, placa, valor_diaria, status, img } = req.body; 

        const query = 'UPDATE veiculos SET marca = ?, modelo = ?, ano = ?, placa = ?, valor_diaria = ?, status = ?, img = ? WHERE id = ?';
        await pool.query(query, [marca, modelo, ano, placa, valor_diaria, status, img, id]);

        res.status(200).json({ mensagem: 'Veículo atualizado com sucesso!' });
    } catch (erro) {
        console.error('Erro ao atualizar veículo:', erro);
        res.status(500).json({ mensagem: 'Erro interno ao tentar atualizar o veículo.' });
    }
};

const deletarVeiculo = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM reservas WHERE veiculo_id = ?', [id]);

        const [resultado] = await pool.query('DELETE FROM veiculos WHERE id = ?', [id]);

if (resultado.affectedRows > 0) {
    res.json({ mensagem: "Veículo e todo o seu histórico de reservas foram excluídos com sucesso!" });
} else {
    res.status(404).json({ mensagem: "Veículo não encontrado no banco de dados." });
}
} catch (erro) {
    console.error("Erro ao deletar veículo:", erro);
    res.status(500).json({ mensagem: "Erro interno do servidor ao deletar o veículo." }); 
}
};

module.exports = {
    listarVeiculos,
    cadastrarVeiculo,
    atualizarVeiculo,
    deletarVeiculo
};