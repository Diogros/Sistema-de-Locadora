const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

console.log("Porta carregada do .env:", process.env.DB_PORT);

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testarConexao() {
    try {
        const conexao = await pool.getConnection();
        console.log('✅ Conexão com o banco de dados MySQL realizada com sucesso!');
        conexao.release(); 
    } catch (erro) {
        console.error('❌ Erro ao conectar no banco de dados:', erro.message);
    }
}

testarConexao();

module.exports = pool;