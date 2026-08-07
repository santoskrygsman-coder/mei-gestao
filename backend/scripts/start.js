const { execSync } = require('child_process');
const path = require('path');

async function main() {
  let url = process.env.DATABASE_URL;
  if (url) {
    // Adiciona o schema 'mei' para evitar o erro de permissão no schema 'public' do Postgres 15
    if (url.includes('?')) {
      url += '&schema=mei';
    } else {
      url += '?schema=mei';
    }
    process.env.DATABASE_URL = url;
    console.log("Configured custom database schema for DigitalOcean.");
  }

  try {
    console.log('Running database migrations...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });
    
    console.log('Starting backend server...');
    require('../dist/index.js');
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

main();
