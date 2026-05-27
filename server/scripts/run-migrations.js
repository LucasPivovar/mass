const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
    const database = process.env.DB_NAME;
    console.log(`🚀 Iniciando migrations no banco: ${database}...`);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: database
        });

        const migrationsDir = path.join(__dirname, '../migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

        for (const file of files) {
            console.log(`\nExecuting migration file: ${file}`);
            const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            
            // Split by semicolon, clean lines, and filter comments
            const statements = content
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            for (let statement of statements) {
                // If it's only comments, skip it
                if (statement.startsWith('--') && !statement.includes('\n')) {
                    continue;
                }

                try {
                    await connection.query(statement);
                } catch (error) {
                    const errno = error.errno;
                    
                    // 1091: Can't DROP column/key because it doesn't exist
                    // 1060: Duplicate column name (column already exists)
                    // 1050: Table already exists
                    // 1061: Duplicate key name (index/key already exists)
                    // 1826: Duplicate foreign key constraint
                    if (errno === 1091 || errno === 1060 || errno === 1050 || errno === 1061 || errno === 1826) {
                        console.log(`   ⚠️  [Ignorado] ${error.sqlMessage}`);
                    } else {
                        console.error(`Error executing statement: "${statement}"`);
                        throw error;
                    }
                }
            }
        }
        console.log('\n✅ Migrations executadas com sucesso!');

        await connection.end();
    } catch (error) {
        console.error('\n❌ Erro ao executar migrations:', error);
        process.exit(1);
    }
}

runMigrations();
