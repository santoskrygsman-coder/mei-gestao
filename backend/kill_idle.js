const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_oF1yTmOWLi4J@ep-red-surf-ach3bc28.sa-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE state = 'idle' AND usename = current_user AND pid <> pg_backend_pid()
        `);
        console.log('Terminated', res.rowCount, 'idle in transaction connections');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
