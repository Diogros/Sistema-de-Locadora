const pool = require('../config/db');

const criarReserva = async (req, res) => {
    try {
        const { usuario_id, veiculo_id, data_inicio, data_fim, valor_total } = req.body;

        if (!usuario_id || !veiculo_id || !data_inicio || !data_fim || !valor_total) {
            return res.status(400).json({ mensagem: 'Todos os dados da reserva são obrigatórios.' });
        }

        const queryVerificarSobreposicao = `
            SELECT id FROM reservas 
            WHERE veiculo_id = ? 
              AND status IN ('Confirmada', 'Pendente') 
              AND NOT (data_fim <= ? OR data_inicio >= ?)
        `;
        
        const [conflitos] = await pool.query(queryVerificarSobreposicao, [veiculo_id, data_inicio, data_fim]);

        if (conflitos.length > 0) {
            return res.status(400).json({ 
                mensagem: 'Este veículo já possui uma reserva ativa ou pendente para o período selecionado.' 
            });
        }

        const queryReserva = `
            INSERT INTO reservas (usuario_id, veiculo_id, data_inicio, data_fim, valor_total, status) 
            VALUES (?, ?, ?, ?, ?, 'Confirmada')
        `;
        await pool.query(queryReserva, [usuario_id, veiculo_id, data_inicio, data_fim, valor_total]);

        const queryAtualizaVeiculo = `UPDATE veiculos SET status = 'alugado' WHERE id = ?`;
        await pool.query(queryAtualizaVeiculo, [veiculo_id]);

        res.status(201).json({ mensagem: 'Reserva confirmada com sucesso!' });
    } catch (erro) {
        console.error('Erro ao criar reserva:', erro);
        res.status(500).json({ mensagem: 'Erro interno ao processar a locação.' });
    }
};

const listarReservas = async (req, res) => {
    try {
        const { usuario_id } = req.query;

        let query = `
            SELECT 
                r.id, 
                u.nome AS cliente, 
                v.marca, 
                v.modelo, 
                v.placa,
                r.data_inicio, 
                r.data_fim, 
                r.valor_total, 
                r.status 
            FROM reservas r
            JOIN usuarios u ON r.usuario_id = u.id
            JOIN veiculos v ON r.veiculo_id = v.id
        `;
        
        const params = [];

        if (usuario_id) {
            query += ` WHERE r.usuario_id = ?`;
            params.push(usuario_id);
        }

        query += ` ORDER BY r.data_criacao DESC`;

        const [reservas] = await pool.query(query, params);
        
        res.status(200).json(reservas);
    } catch (erro) {
        console.error('Erro ao buscar reservas:', erro);
        res.status(500).json({ mensagem: 'Erro interno ao buscar o histórico de locações.' });
    }
};

const atualizarStatusReserva = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await pool.query('UPDATE reservas SET status = ? WHERE id = ?', [status, id]);

        const statusNormalizado = status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        
        if (statusNormalizado === 'concluida' || statusNormalizado === 'cancelada') {
            
            const [reserva] = await pool.query('SELECT veiculo_id FROM reservas WHERE id = ?', [id]);
            
            if (reserva && reserva.length > 0) {
                const veiculoId = reserva[0].veiculo_id;

                await pool.query('UPDATE veiculos SET status = "Disponivel" WHERE id = ?', [veiculoId]);
                console.log(`🚗 Veículo ID ${veiculoId} foi liberado com sucesso!`);
            }
        }

        res.json({ mensagem: "Status atualizado com sucesso!" });

    } catch (erro) {
        console.error("Erro ao atualizar a reserva:", erro);
        res.status(500).json({ erro: "Erro interno do servidor ao atualizar." });
    }
};

module.exports = { 
    criarReserva, 
    listarReservas, 
    atualizarStatusReserva 
};