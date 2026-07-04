// backend/migrate.js
// Script de Migração Automatizado para Aplicar o Schema SQL no PostgreSQL

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ [MIGRATE] Erro: DATABASE_URL não definida no seu arquivo .env');
        process.exit(1);
    }

    console.log('📡 [MIGRATE] Conectando ao banco de dados PostgreSQL...');
    
    const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    const enableSsl = process.env.DATABASE_SSL === 'true' || (!isLocalhost && !dbUrl.startsWith('postgresql://postgres@'));

    const client = new Client({
        connectionString: dbUrl,
        ssl: enableSsl ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('✅ [MIGRATE] Conectado com sucesso!');

        const schemaPath = path.join(__dirname, 'schema.sql');
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Arquivo schema.sql não localizado em: ${schemaPath}`);
        }

        console.log('📖 [MIGRATE] Lendo arquivo schema.sql...');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('⚙️ [MIGRATE] Executando comandos SQL no banco...');
        // Executa todo o script SQL
        await client.query(sql);

        console.log('🎉 [MIGRATE] Migração concluída com sucesso! Tabelas e seeds criados no PostgreSQL.');
    } catch (err) {
        console.error('❌ [MIGRATE] Erro crítico na migração:', err.message);
    } finally {
        await client.end();
        console.log('🔌 [MIGRATE] Conexão encerrada.');
    }
}

migrate();
