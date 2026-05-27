const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'bot_disparo';

  console.log('🔧 Verificando/Criando banco de dados...');

  try {
    // Conectar sem especificar o banco de dados
    const connection = await mysql.createConnection({
      host,
      user,
      password,
    });

    // Criar o banco de dados se não existir
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    console.log(`✅ Banco de dados '${database}' criado ou já existe!`);
    
    await connection.end();
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Erro: Não foi possível conectar ao MySQL. Verifique se ele está rodando.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('❌ Erro: Acesso negado. Verifique as credenciais no .env');
    } else {
      console.error('❌ Erro ao criar banco de dados:', error.message);
    }
    process.exit(1);
  }
}

createDatabase();
