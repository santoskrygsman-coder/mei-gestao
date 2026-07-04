// server.js (Servidor de Desenvolvimento super leve e sem dependências)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8082;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Extrai o caminho limpo desconsiderando query parameters (?...) e hashes (#...)
    const cleanUrl = req.url.split('?')[0].split('#')[0];
    let filePath = '.' + cleanUrl;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Arquivo Não Encontrado</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Erro no servidor: ${error.code} ..\n`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Servidor MEI Fácil Gestão rodando em http://localhost:${PORT}`);
});
