// backend/server.js
// Servidor API Central para o MEI Fácil Gestão

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'mei_facil_default_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Suporte a upload de logotipos em base64

// Logger de Requisições para Diagnóstico
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`📡 [API] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Middleware de Autenticação JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado.' });
        }
        req.user = user;
        next();
    });
}

// Middleware de Restrição para Admins
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Recurso restrito a administradores.' });
    }
    next();
}

// Rota de Status da API
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        message: 'MEI Fácil Gestão API is running.',
        timestamp: new Date().toISOString()
    });
});

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const user = await db.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
        }

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
        }

        // Gera token
        const token = jwt.sign(
            { id: user.id, company_id: user.company_id, name: user.name, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            token,
            user: {
                name: user.name,
                username: user.username,
                role: user.role,
                company_id: user.company_id,
                company_name: user.company_name
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro no servidor durante a autenticação.' });
    }
});

// --- CONFIGURAÇÃO DA EMPRESA ---

app.get('/api/config', authenticateToken, async (req, res) => {
    try {
        const company = await db.getCompany(req.user.company_id);
        if (!company) {
            return res.status(404).json({ error: 'Empresa não encontrada.' });
        }
        res.json(company);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao buscar configurações.' });
    }
});

app.post('/api/config', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const updated = await db.updateCompany(req.user.company_id, req.body);
        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao salvar configurações.' });
    }
});

// --- USUÁRIOS ---

app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await db.getUsers(req.user.company_id);
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
});

app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const saved = await db.saveUser(req.user.company_id, req.body);
        res.json(saved);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao salvar usuário. O login digitado pode já existir.' });
    }
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const success = await db.deleteUser(req.user.company_id, req.params.id);
        if (success) {
            res.json({ message: 'Usuário removido com sucesso.' });
        } else {
            res.status(404).json({ error: 'Usuário não encontrado.' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Erro ao deletar usuário.' });
    }
});

// --- PRODUTOS ---

app.get('/api/products', authenticateToken, async (req, res) => {
    try {
        const products = await db.getProducts(req.user.company_id);
        res.json(products);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao listar produtos.' });
    }
});

app.post('/api/products', authenticateToken, async (req, res) => {
    // Admins podem cadastrar/editar; vendedores só não podem editar/excluir no front, mas mantemos segurança básica
    try {
        const saved = await db.saveProduct(req.user.company_id, req.body);
        res.json(saved);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao salvar produto.' });
    }
});

app.post('/api/products/stock-adjust', authenticateToken, requireAdmin, async (req, res) => {
    const { id, qty } = req.body;
    try {
        const newStock = await db.adjustStock(req.user.company_id, id, qty);
        res.json({ id, stock: newStock });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao ajustar estoque.' });
    }
});

app.delete('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const success = await db.deleteProduct(req.user.company_id, req.params.id);
        if (success) {
            res.json({ message: 'Produto excluído com sucesso.' });
        } else {
            res.status(404).json({ error: 'Produto não encontrado.' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Erro ao excluir produto.' });
    }
});

// --- CLIENTES ---

app.get('/api/clients', authenticateToken, async (req, res) => {
    try {
        const clients = await db.getClients(req.user.company_id);
        res.json(clients);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }
});

app.post('/api/clients', authenticateToken, async (req, res) => {
    try {
        const saved = await db.saveClient(req.user.company_id, req.body);
        res.json(saved);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao salvar cliente.' });
    }
});

app.delete('/api/clients/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const success = await db.deleteClient(req.user.company_id, req.params.id);
        if (success) {
            res.json({ message: 'Cliente removido com sucesso.' });
        } else {
            res.status(404).json({ error: 'Cliente não encontrado.' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Erro ao excluir cliente.' });
    }
});

// Atualiza saldo do cliente diretamente (Fiado/Crédito)
app.post('/api/clients/:id/balance', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    try {
        const newBalance = await db.updateClientBalance(req.user.company_id, req.params.id, amount);
        res.json({ id: req.params.id, balance: newBalance });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao atualizar saldo do cliente.' });
    }
});

// Quitação de débito (Fiado)
app.post('/api/clients/payment', authenticateToken, async (req, res) => {
    const { clientId, amount, method } = req.body;
    try {
        const c = (await db.getClients(req.user.company_id)).find(item => item.id === clientId);
        if (!c) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }

        // Abate o saldo devedor
        await db.updateClientBalance(req.user.company_id, clientId, amount);

        // Registra transação no fluxo de caixa
        await db.addTransaction(req.user.company_id, {
            type: 'receita',
            desc: `Rec. Fiado: ${c.name} (${method})`,
            amount: amount,
            category: 'Fiado'
        });

        res.json({ message: 'Quitação registrada com sucesso.' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao processar quitação de débito.' });
    }
});

// --- TRANSAÇÕES (Financeiro) ---

app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const list = await db.getTransactions(req.user.company_id);
        res.json(list);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao listar transações.' });
    }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const saved = await db.addTransaction(req.user.company_id, req.body);
        res.json(saved);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao registrar transação.' });
    }
});

app.delete('/api/transactions/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const success = await db.deleteTransaction(req.user.company_id, req.params.id);
        if (success) {
            res.json({ message: 'Transação excluída com sucesso.' });
        } else {
            res.status(404).json({ error: 'Transação não encontrada.' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Erro ao excluir transação.' });
    }
});

// --- CONTAS (Contas a pagar/receber) ---

app.get('/api/accounts', authenticateToken, async (req, res) => {
    try {
        const list = await db.getAccounts(req.user.company_id);
        res.json(list);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao listar contas.' });
    }
});

app.post('/api/accounts', authenticateToken, async (req, res) => {
    try {
        const saved = await db.saveAccount(req.user.company_id, req.body);
        res.json(saved);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao salvar conta.' });
    }
});

app.delete('/api/accounts/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const success = await db.deleteAccount(req.user.company_id, req.params.id);
        if (success) {
            res.json({ message: 'Título excluído com sucesso.' });
        } else {
            res.status(404).json({ error: 'Título não encontrado.' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Erro ao excluir título.' });
    }
});

// --- VENDAS / DOCUMENTOS ---

app.get('/api/documents', authenticateToken, async (req, res) => {
    try {
        const list = await db.getDocuments(req.user.company_id);
        res.json(list);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao listar documentos.' });
    }
});

app.post('/api/documents', authenticateToken, async (req, res) => {
    const sale = req.body;
    try {
        // 1. Valida estoque físico no servidor antes
        const products = await db.getProducts(req.user.company_id);
        for (const item of sale.items) {
            const p = products.find(prod => prod.id === item.id);
            if (!p || p.stock < item.qty) {
                return res.status(400).json({ error: `Estoque insuficiente do produto: ${item.name}` });
            }
        }

        // 2. Decrementa o estoque físico
        for (const item of sale.items) {
            await db.adjustStock(req.user.company_id, item.id, -item.qty);
        }

        // 3. Salva o documento de venda
        const saved = await db.saveDocument(req.user.company_id, sale);

        // 4. Se usou crédito de cliente, deduz do saldo
        if (sale.creditUsed > 0) {
            await db.updateClientBalance(req.user.company_id, sale.client_id, -sale.creditUsed);
        }

        // 5. Registra o financeiro correspondente ao restante
        if (sale.remaining > 0) {
            if (sale.paymentMethod === 'Crediário') {
                // Cria conta a receber
                await db.saveAccount(req.user.company_id, {
                    type: 'receber',
                    desc: `Venda a prazo: ${saved.id}`,
                    client_id: sale.client_id,
                    amount: sale.remaining,
                    dueDate: sale.due_date,
                    status: 'pendente'
                });
                // Registra o débito no saldo do cliente
                await db.updateClientBalance(req.user.company_id, sale.client_id, -sale.remaining);
            } else {
                // Venda à vista imediata no caixa
                await db.addTransaction(req.user.company_id, {
                    type: 'receita',
                    desc: `Venda PDV: ${saved.id}${sale.creditUsed > 0 ? ' (Abatido Crédito)' : ''}`,
                    amount: sale.remaining,
                    category: 'Vendas'
                });
            }
        }

        res.json(saved);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao registrar venda.' });
    }
});

// Cancelamento de venda
app.post('/api/documents/:id/cancel', authenticateToken, requireAdmin, async (req, res) => {
    const docId = req.params.id;
    try {
        const docs = await db.getDocuments(req.user.company_id);
        const doc = docs.find(d => d.id === docId);

        if (!doc) {
            return res.status(404).json({ error: 'Documento não encontrado.' });
        }
        if (doc.status === 'cancelada') {
            return res.status(400).json({ error: 'Esta venda já está cancelada.' });
        }

        // 1. Estorna estoque físico de volta
        for (const item of doc.items) {
            await db.adjustStock(req.user.company_id, item.id, item.qty);
        }

        // 2. Estorna do Financeiro
        if (doc.payment_method === 'Crediário' || doc.paymentMethod === 'Crediário') {
            // Remove contas a receber pendentes
            await db.deleteAccountByDesc(req.user.company_id, docId);
            // Estorna saldo devedor/crédito total da venda ao cliente
            await db.updateClientBalance(req.user.company_id, doc.client_id, doc.total);
        } else {
            // Remove a transação à vista do Livro Caixa
            await db.deleteTransactionByDesc(req.user.company_id, docId);
            // Se usou crédito de cliente, devolve ao saldo do cliente
            if (doc.credit_used > 0 || doc.creditUsed > 0) {
                const cred = doc.credit_used || doc.creditUsed;
                await db.updateClientBalance(req.user.company_id, doc.client_id, cred);
            }
        }

        // 3. Atualiza o status no banco
        await db.cancelDocument(req.user.company_id, docId);

        res.json({ message: 'Venda cancelada e estornos realizados com sucesso.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao cancelar venda.' });
    }
});

// --- SERVIR ARQUIVOS ESTÁTICOS DO FRONTEND ---
const path = require('path');

// Serve arquivos estáticos da pasta raiz (HTML, CSS, JS, manifest, etc.)
app.use(express.static(path.join(__dirname, '../')));

// Roteador de fallback para direcionar requisições do navegador para o index.html
app.get('*', (req, res, next) => {
    // Se for rota da API (/api/...), deixa passar para retornar 404 da API
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Inicia servidor
app.listen(PORT, () => {
    console.log(`🚀 [SERVER] Servidor rodando online na porta ${PORT}`);
});
