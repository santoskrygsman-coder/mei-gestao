const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const hash = await bcrypt.hash('vksanttos123', 10);
        await pool.query('UPDATE users SET password = $1 WHERE username = $2', [hash, 'admin']);
        console.log('Password updated successfully to vksanttos123.');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
