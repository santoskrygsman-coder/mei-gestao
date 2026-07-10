// backend/db.js
// Camada de Acesso a Dados (DAL) com suporte dual: PostgreSQL ou Mock JSON Local

const { Pool, types } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Parse PostgreSQL numeric types (OID 1700) as JS floats instead of strings
types.setTypeParser(1700, function(val) {
    return parseFloat(val);
});

let useMock = false;
let pool = null;
const mockFilePath = path.join(__dirname, 'database_mock.json');
let mockDb = {};

// Dados iniciais para sementes de teste do mock
const defaultSeedData = {
    companies: [
        {
            id: 1,
            name: 'Mercadinho do Bairro',
            cnpj: '12.345.678/0001-90',
            phone: '(11) 98765-4321',
            address: 'Rua das Flores, 123',
            markup: 30.00,
            wa_mode: 'link',
            wa_endpoint: '',
            wa_token: '',
            logo_base64: '',
            footer_message: 'Obrigado pela preferência!'
        }
    ],
    users: [
        {
            id: 1,
            company_id: 1,
            name: 'Administrador Principal',
            username: 'admin',
            password: '$2a$10$8nd5drp/dWY1Csc6SlyfD.F9zh3YFbFvgAue3IWwYZlDOsbU.cyBS', // admin
            role: 'admin'
        },
        {
            id: 2,
            company_id: 1,
            name: 'Caixa Operador',
            username: 'caixa',
            password: '$2a$10$tMNpI0JI1Fgxg1bnRIXZkucsGGhYsql7RjzD4yWqmcgD7X2aMEHFm', // caixa
            role: 'vendedor'
        }
    ],
    products: [
        { id: '7891234567890', company_id: 1, name: 'Arroz Integral 1kg', cost: 4.50, price: 6.90, stock: 45.00, min_stock: 10.00 },
        { id: '7891234567891', company_id: 1, name: 'Feijão Carioca 1kg', cost: 6.00, price: 8.99, stock: 5.00, min_stock: 12.00 },
        { id: '7891234567892', company_id: 1, name: 'Azeite Extra Virgem', cost: 18.50, price: 24.90, stock: 2.00, min_stock: 5.00 },
        { id: '7891234567893', company_id: 1, name: 'Café Torrado 500g', cost: 8.20, price: 12.50, stock: 25.00, min_stock: 8.00 }
    ],
    clients: [
        { id: 'c1', company_id: 1, name: 'Consumidor Geral', doc: '', phone: '', email: '', balance: 0.00 },
        { id: 'c2', company_id: 1, name: 'Carlos Eduardo Silva', doc: '123.456.789-00', phone: '(11) 99999-8888', email: 'carlos@email.com', balance: -50.00 },
        { id: 'c3', company_id: 1, name: 'Mariana Dias Oliveira', doc: '987.654.321-11', phone: '(11) 98888-7777', email: 'mariana@email.com', balance: 0.00 },
        { id: 'c4', company_id: 1, name: 'Ana Beatriz Ramos', doc: '456.789.123-22', phone: '(11) 97777-6666', email: 'ana@email.com', balance: 120.00 }
    ],
    documents: [],
    document_items: [],
    transactions: [
        { id: 1, company_id: 1, type: 'receita', description: 'Venda de Balcão', amount: 15.00, category: 'Vendas', date: new Date().toISOString().split('T')[0] }
    ],
    accounts: [
        { id: 1, company_id: 1, type: 'receber', description: 'Venda a prazo: V-001', client_id: 'c2', amount: 50.00, due_date: new Date().toISOString().split('T')[0], status: 'pendente' }
    ]
};

// Inicializa a conexão
function initDb() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.warn('⚠️ [DB] DATABASE_URL não definida no .env. Utilizando banco mock em arquivo JSON!');
        setupMock();
        return;
    }

    try {
        const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
        const enableSsl = process.env.DATABASE_SSL === 'true' || (!isLocalhost && !dbUrl.startsWith('postgresql://postgres@'));
        
        pool = new Pool({
            connectionString: dbUrl,
            ssl: enableSsl ? { rejectUnauthorized: false } : false
        });

        // Testa conexão
        pool.query('SELECT NOW()', (err, res) => {
            if (err) {
                console.error('❌ [DB] Falha ao conectar no PostgreSQL. Código do erro:', err.message);
                console.warn('⚠️ [DB] Redirecionando para o banco mock em arquivo JSON para testes locais!');
                setupMock();
            } else {
                console.log('✅ [DB] Conectado ao banco de dados PostgreSQL remoto com SSL/TLS ativo!');
            }
        });
    } catch (e) {
        console.error('❌ [DB] Erro ao inicializar pool do PostgreSQL:', e.message);
        setupMock();
        setupMock();
    }
}

// Configura o fallback Mock JSON
function setupMock() {
    useMock = true;
    if (fs.existsSync(mockFilePath)) {
        try {
            mockDb = JSON.parse(fs.readFileSync(mockFilePath, 'utf8'));
            console.log('📦 [DB-MOCK] Banco local carregado com sucesso a partir de database_mock.json');
        } catch (e) {
            console.error('❌ [DB-MOCK] Erro ao ler database_mock.json. Inicializando dados zerados.', e.message);
            mockDb = { ...defaultSeedData };
            saveMock();
        }
    } else {
        console.log('📦 [DB-MOCK] Criando novo banco de dados mock local: database_mock.json');
        mockDb = { ...defaultSeedData };
        saveMock();
    }
}

function saveMock() {
    try {
        fs.writeFileSync(mockFilePath, JSON.stringify(mockDb, null, 2), 'utf8');
    } catch (e) {
        console.error('❌ [DB-MOCK] Falha ao salvar database_mock.json:', e.message);
    }
}

// Inicializa ao importar
initDb();

module.exports = {
    // --- EMPRESAS ---
    async getCompany(id) {
        if (useMock) {
            return mockDb.companies.find(c => c.id === Number(id)) || null;
        }
        const res = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
        return res.rows[0] || null;
    },

    async updateCompany(id, data) {
        if (useMock) {
            const comp = mockDb.companies.find(c => c.id === Number(id));
            if (comp) {
                Object.assign(comp, data);
                saveMock();
            }
            return comp;
        }
        const { name, cnpj, phone, address, markup, wa_mode, wa_endpoint, wa_token, logo_base64, footer_message } = data;
        const res = await pool.query(`
            UPDATE companies 
            SET name=$1, cnpj=$2, phone=$3, address=$4, markup=$5, wa_mode=$6, wa_endpoint=$7, wa_token=$8, logo_base64=$9, footer_message=$10
            WHERE id=$11 RETURNING *
        `, [name, cnpj, phone, address, markup, wa_mode, wa_endpoint, wa_token, logo_base64, footer_message, id]);
        return res.rows[0];
    },

    // --- USUÁRIOS ---
    async getUserByUsername(username) {
        if (useMock) {
            const user = mockDb.users.find(u => u.username.toLowerCase() === username.toLowerCase());
            if (user) {
                // Adiciona o nome fantasia da empresa ao usuário mock
                const comp = mockDb.companies.find(c => c.id === user.company_id);
                user.company_name = comp ? comp.name : 'MEI Fácil';
            }
            return user || null;
        }
        const res = await pool.query(`
            SELECT u.*, c.name as company_name 
            FROM users u
            LEFT JOIN companies c ON u.company_id = c.id
            WHERE u.username = $1
        `, [username]);
        return res.rows[0] || null;
    },

    async getUsers(companyId) {
        if (useMock) {
            return mockDb.users.filter(u => u.company_id === Number(companyId));
        }
        const res = await pool.query('SELECT id, company_id, name, username, role FROM users WHERE company_id = $1', [companyId]);
        return res.rows;
    },

    async saveUser(companyId, user) {
        if (useMock) {
            if (user.id) {
                const existing = mockDb.users.find(u => u.id === Number(user.id) && u.company_id === Number(companyId));
                if (existing) {
                    existing.name = user.name;
                    existing.username = user.username;
                    existing.role = user.role;
                    if (user.password) {
                        existing.password = bcrypt.hashSync(user.password, 10);
                    }
                }
                saveMock();
                return existing;
            } else {
                const newUser = {
                    id: mockDb.users.length ? Math.max(...mockDb.users.map(u => u.id)) + 1 : 1,
                    company_id: Number(companyId),
                    name: user.name,
                    username: user.username,
                    password: bcrypt.hashSync(user.password, 10),
                    role: user.role
                };
                mockDb.users.push(newUser);
                saveMock();
                return newUser;
            }
        }

        const hashedPw = user.password ? bcrypt.hashSync(user.password, 10) : null;
        if (user.id) {
            if (hashedPw) {
                const res = await pool.query(`
                    UPDATE users SET name=$1, username=$2, role=$3, password=$4
                    WHERE id=$5 AND company_id=$6 RETURNING id, company_id, name, username, role
                `, [user.name, user.username, user.role, hashedPw, user.id, companyId]);
                return res.rows[0];
            } else {
                const res = await pool.query(`
                    UPDATE users SET name=$1, username=$2, role=$3
                    WHERE id=$4 AND company_id=$5 RETURNING id, company_id, name, username, role
                `, [user.name, user.username, user.role, user.id, companyId]);
                return res.rows[0];
            }
        } else {
            const res = await pool.query(`
                INSERT INTO users (company_id, name, username, password, role)
                VALUES ($1, $2, $3, $4, $5) RETURNING id, company_id, name, username, role
            `, [companyId, user.name, user.username, hashedPw, user.role]);
            return res.rows[0];
        }
    },

    async deleteUser(companyId, id) {
        if (useMock) {
            const idx = mockDb.users.findIndex(u => u.id === Number(id) && u.company_id === Number(companyId));
            if (idx !== -1) {
                mockDb.users.splice(idx, 1);
                saveMock();
                return true;
            }
            return false;
        }
        const res = await pool.query('DELETE FROM users WHERE id = $1 AND company_id = $2', [id, companyId]);
        return res.rowCount > 0;
    },

    // --- PRODUTOS ---
    async getProducts(companyId) {
        if (useMock) {
            return mockDb.products
                .filter(p => p.company_id === Number(companyId))
                .map(p => ({ ...p, minStock: p.minStock !== undefined ? p.minStock : p.min_stock }));
        }
        const res = await pool.query('SELECT id, company_id, barcode, name, category, cost, price, stock, min_stock as "minStock" FROM products WHERE company_id = $1 ORDER BY name ASC', [companyId]);
        return res.rows.map(p => ({
            ...p,
            cost: Number(p.cost),
            price: Number(p.price),
            stock: Number(p.stock),
            minStock: Number(p.minStock)
        }));
    },

    async saveProduct(companyId, product) {
        const minStockVal = product.minStock !== undefined ? product.minStock : product.min_stock;
        if (useMock) {
            const existing = mockDb.products.find(p => p.id === product.id && p.company_id === Number(companyId));
            if (existing) {
                existing.barcode = product.barcode || '';
                existing.name = product.name;
                existing.category = product.category || '';
                existing.cost = Number(product.cost);
                existing.price = Number(product.price);
                existing.stock = Number(product.stock);
                existing.min_stock = Number(minStockVal || 0);
                saveMock();
                return { ...existing, minStock: existing.min_stock };
            } else {
                const newProd = {
                    id: product.id,
                    company_id: Number(companyId),
                    barcode: product.barcode || '',
                    name: product.name,
                    category: product.category || '',
                    cost: Number(product.cost),
                    price: Number(product.price),
                    stock: Number(product.stock),
                    min_stock: Number(minStockVal || 0)
                };
                mockDb.products.push(newProd);
                saveMock();
                return { ...newProd, minStock: newProd.min_stock };
            }
        }

        const res = await pool.query(`
            INSERT INTO products (id, company_id, barcode, name, category, cost, price, stock, min_stock)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id, company_id) DO UPDATE 
            SET barcode=$3, name=$4, category=$5, cost=$6, price=$7, stock=$8, min_stock=$9
            RETURNING id, company_id, barcode, name, category, cost, price, stock, min_stock as "minStock"
        `, [
            product.id,
            companyId,
            product.barcode || '',
            product.name,
            product.category || '',
            product.cost || 0,
            product.price || 0,
            product.stock || 0,
            minStockVal || 0
        ]);
        
        const row = res.rows[0];
        if (row) {
            row.cost = Number(row.cost);
            row.price = Number(row.price);
            row.stock = Number(row.stock);
            row.minStock = Number(row.minStock);
        }
        return row;
    },

    async adjustStock(companyId, id, qtyChange) {
        if (useMock) {
            const p = mockDb.products.find(prod => prod.id === id && prod.company_id === Number(companyId));
            if (p) {
                p.stock = Number((p.stock + Number(qtyChange)).toFixed(2));
                saveMock();
                return p.stock;
            }
            return 0;
        }
        const res = await pool.query(`
            UPDATE products SET stock = stock + $1 
            WHERE id = $2 AND company_id = $3 
            RETURNING stock
        `, [qtyChange, id, companyId]);
        return res.rows[0] ? res.rows[0].stock : 0;
    },

    async deleteProduct(companyId, id) {
        if (useMock) {
            const idx = mockDb.products.findIndex(p => p.id === id && p.company_id === Number(companyId));
            if (idx !== -1) {
                mockDb.products.splice(idx, 1);
                saveMock();
                return true;
            }
            return false;
        }
        const res = await pool.query('DELETE FROM products WHERE id = $1 AND company_id = $2', [id, companyId]);
        return res.rowCount > 0;
    },

    // --- CLIENTES ---
    async getClients(companyId) {
        if (useMock) {
            return mockDb.clients.filter(c => c.company_id === Number(companyId));
        }
        const res = await pool.query('SELECT * FROM clients WHERE company_id = $1 ORDER BY name ASC', [companyId]);
        return res.rows;
    },

    async saveClient(companyId, client) {
        if (useMock) {
            if (client.id) {
                const existing = mockDb.clients.find(c => c.id === client.id && c.company_id === Number(companyId));
                if (existing) {
                    existing.name = client.name;
                    existing.doc = client.doc;
                    existing.phone = client.phone;
                    existing.email = client.email;
                }
                saveMock();
                return existing;
            } else {
                const newClient = {
                    id: 'c' + (mockDb.clients.length + 1),
                    company_id: Number(companyId),
                    name: client.name,
                    doc: client.doc,
                    phone: client.phone,
                    email: client.email,
                    balance: 0.00
                };
                mockDb.clients.push(newClient);
                saveMock();
                return newClient;
            }
        }

        const { id, name, doc, phone, email } = client;
        if (id) {
            const res = await pool.query(`
                UPDATE clients SET name=$1, doc=$2, phone=$3, email=$4
                WHERE id=$5 AND company_id=$6 RETURNING *
            `, [name, doc, phone, email, id, companyId]);
            return res.rows[0];
        } else {
            const newId = 'cli_' + Math.random().toString(36).substring(2, 9);
            const res = await pool.query(`
                INSERT INTO clients (id, company_id, name, doc, phone, email, balance)
                VALUES ($1, $2, $3, $4, $5, $6, 0.00) RETURNING *
            `, [newId, companyId, name, doc, phone, email]);
            return res.rows[0];
        }
    },

    async updateClientBalance(companyId, id, balanceChange) {
        if (useMock) {
            const c = mockDb.clients.find(cli => cli.id === id && cli.company_id === Number(companyId));
            if (c) {
                c.balance = Number((c.balance + Number(balanceChange)).toFixed(2));
                saveMock();
                return c.balance;
            }
            return 0;
        }
        const res = await pool.query(`
            UPDATE clients SET balance = balance + $1
            WHERE id = $2 AND company_id = $3
            RETURNING balance
        `, [balanceChange, id, companyId]);
        return res.rows[0] ? res.rows[0].balance : 0;
    },

    async deleteClient(companyId, id) {
        if (useMock) {
            const idx = mockDb.clients.findIndex(c => c.id === id && c.company_id === Number(companyId));
            if (idx !== -1) {
                mockDb.clients.splice(idx, 1);
                saveMock();
                return true;
            }
            return false;
        }
        const res = await pool.query('DELETE FROM clients WHERE id = $1 AND company_id = $2', [id, companyId]);
        return res.rowCount > 0;
    },

    // --- DOCUMENTOS (Vendas, Orçamentos, etc.) ---
    async getDocuments(companyId) {
        if (useMock) {
            const docs = mockDb.documents.filter(d => d.company_id === Number(companyId));
            // Carrega itens de cada documento
            return docs.map(d => {
                const items = mockDb.document_items.filter(item => item.document_id === d.id && item.company_id === Number(companyId));
                return { ...d, items };
            });
        }
        const resDocs = await pool.query('SELECT * FROM documents WHERE company_id = $1 ORDER BY date DESC, id DESC', [companyId]);
        const documents = resDocs.rows;

        // Injeta itens
        for (let doc of documents) {
            const resItems = await pool.query('SELECT product_id as id, name, price, qty FROM document_items WHERE document_id = $1 AND company_id = $2', [doc.id, companyId]);
            doc.items = resItems.rows;
        }
        return documents;
    },
    
    async getNextDocumentId(companyId) {
        if (useMock) {
            let maxNum = 0;
            if (mockDb.documents) {
                for (const d of mockDb.documents) {
                    if (d.company_id === companyId && d.id.startsWith('DOC-')) {
                        const num = parseInt(d.id.replace('DOC-', ''), 10);
                        if (!isNaN(num) && num > maxNum) maxNum = num;
                    }
                }
            }
            return `DOC-${String(maxNum + 1).padStart(6, '0')}`;
        }
        
        const res = await pool.query(`
            SELECT id FROM documents 
            WHERE company_id = $1 AND id LIKE 'DOC-%'
        `, [companyId]);
        
        let maxNum = 0;
        for (const row of res.rows) {
            const num = parseInt(row.id.replace('DOC-', ''), 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
        }
        return `DOC-${String(maxNum + 1).padStart(6, '0')}`;
    },

    async saveDocument(companyId, doc) {
        let docId = doc.id;
        if (!docId) {
            docId = await this.getNextDocumentId(companyId);
        }

        if (useMock) {
            const newDoc = {
                id: docId,
                company_id: Number(companyId),
                type: doc.type,
                client_id: doc.client_id,
                client_name: doc.client_name,
                date: doc.date || new Date().toISOString().split('T')[0],
                discount: Number(doc.discount || 0),
                addition: Number(doc.addition || 0),
                total: Number(doc.total),
                credit_used: Number(doc.creditUsed || 0),
                remaining: Number(doc.remaining || doc.total),
                status: doc.status || 'finalizado',
                payment_method: doc.paymentMethod,
                due_date: doc.due_date
            };
            mockDb.documents.push(newDoc);

            // Grava itens
            if (doc.items && doc.items.length) {
                doc.items.forEach(item => {
                    mockDb.document_items.push({
                        document_id: newDoc.id,
                        company_id: Number(companyId),
                        product_id: item.id,
                        name: item.name,
                        price: Number(item.price),
                        qty: Number(item.qty)
                    });
                });
            }
            saveMock();
            newDoc.items = doc.items;
            return newDoc;
        }

        const { type, client_id, client_name, date, discount, addition, total, creditUsed, remaining, status, paymentMethod, due_date } = doc;
        const finalDate = date || new Date().toISOString().split('T')[0];
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`
                INSERT INTO documents (id, company_id, type, client_id, client_name, date, discount, addition, total, credit_used, remaining, status, payment_method, due_date)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `, [docId, companyId, type, client_id, client_name, finalDate, discount || 0, addition || 0, total, creditUsed || 0, remaining || total, status || 'finalizado', paymentMethod, due_date || null]);

            if (doc.items && doc.items.length) {
                for (let item of doc.items) {
                    await client.query(`
                        INSERT INTO document_items (document_id, company_id, product_id, name, price, qty)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [docId, companyId, item.id, item.name, item.price, item.qty]);
                }
            }
            await client.query('COMMIT');
            return { ...doc, id: docId, date: finalDate };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    async updateDocumentStatus(companyId, docId, status) {
        if (useMock) {
            const doc = mockDb.documents.find(d => d.id === docId && d.company_id === Number(companyId));
            if (doc) {
                doc.status = status;
                saveMock();
                return true;
            }
            return false;
        }
        const res = await pool.query('UPDATE documents SET status = $1 WHERE id = $2 AND company_id = $3', [status, docId, companyId]);
        return res.rowCount > 0;
    },

    async updateDocument(companyId, docId, docData) {
        if (useMock) {
            const doc = mockDb.documents.find(d => d.id === docId && d.company_id === Number(companyId));
            if (doc) {
                Object.assign(doc, docData);
                saveMock();
                return doc;
            }
            return null;
        }
        const { total, remaining, status } = docData;
        const res = await pool.query(`
            UPDATE documents SET total = COALESCE($1, total), remaining = COALESCE($2, remaining), status = COALESCE($3, status)
            WHERE id = $4 AND company_id = $5 RETURNING *
        `, [total, remaining, status, docId, companyId]);
        
        if (res.rows.length > 0) {
            // Se vierem items, o ideal seria atualizar os items tbm, mas pra simplificar o flow atual do condicional...
            if (docData.items) {
                await pool.query('DELETE FROM document_items WHERE document_id = $1 AND company_id = $2', [docId, companyId]);
                for (let item of docData.items) {
                    await pool.query(`
                        INSERT INTO document_items (document_id, company_id, product_id, name, price, qty)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [docId, companyId, item.id, item.name, item.price, item.qty]);
                }
            }
            return res.rows[0];
        }
        return null;
    },

    async cancelDocument(companyId, docId) {
        if (useMock) {
            const doc = mockDb.documents.find(d => d.id === docId && d.company_id === Number(companyId));
            if (doc) {
                doc.status = 'cancelada';
                saveMock();
                return true;
            }
            return false;
        }
        const res = await pool.query("UPDATE documents SET status = 'cancelada' WHERE id = $1 AND company_id = $2", [docId, companyId]);
        return res.rowCount > 0;
    },

    // --- TRANSAÇÕES (Caixa) ---
    async getTransactions(companyId) {
        if (useMock) {
            return mockDb.transactions.filter(t => t.company_id === Number(companyId));
        }
        const res = await pool.query('SELECT * FROM transactions WHERE company_id = $1 ORDER BY date DESC, id DESC', [companyId]);
        return res.rows;
    },

    async addTransaction(companyId, t) {
        if (useMock) {
            const newT = {
                id: mockDb.transactions.length ? Math.max(...mockDb.transactions.map(item => item.id)) + 1 : 1,
                company_id: Number(companyId),
                type: t.type,
                description: t.desc || t.description,
                amount: Number(t.amount),
                category: t.category,
                date: t.date || new Date().toISOString().split('T')[0]
            };
            mockDb.transactions.push(newT);
            saveMock();
            return newT;
        }
        const res = await pool.query(`
            INSERT INTO transactions (company_id, type, description, amount, category, date)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `, [companyId, t.type, t.desc || t.description, t.amount, t.category, t.date || new Date()]);
        return res.rows[0];
    },

    async deleteTransactionByDesc(companyId, descSubstring) {
        if (useMock) {
            const idx = mockDb.transactions.findIndex(t => t.description.includes(descSubstring) && t.company_id === Number(companyId));
            if (idx !== -1) {
                mockDb.transactions.splice(idx, 1);
                saveMock();
                return true;
            }
            return false;
        }
        const res = await pool.query('DELETE FROM transactions WHERE company_id = $1 AND description LIKE $2', [companyId, `%${descSubstring}%`]);
        return res.rowCount > 0;
    },

    // --- CONTAS A PAGAR / RECEBER ---
    async getAccounts(companyId) {
        if (useMock) {
            return mockDb.accounts.filter(a => a.company_id === Number(companyId));
        }
        const res = await pool.query('SELECT * FROM accounts WHERE company_id = $1 ORDER BY due_date ASC', [companyId]);
        return res.rows;
    },

    async saveAccount(companyId, acc) {
        if (useMock) {
            if (acc.id) {
                const existing = mockDb.accounts.find(a => a.id === Number(acc.id) && a.company_id === Number(companyId));
                if (existing) {
                    existing.description = acc.description;
                    existing.amount = Number(acc.amount);
                    existing.due_date = acc.due_date || acc.dueDate;
                    existing.status = acc.status;
                }
                saveMock();
                return existing;
            } else {
                const newAcc = {
                    id: mockDb.accounts.length ? Math.max(...mockDb.accounts.map(item => item.id)) + 1 : 1,
                    company_id: Number(companyId),
                    type: acc.type,
                    description: acc.desc || acc.description,
                    client_id: acc.client_id,
                    amount: Number(acc.amount),
                    due_date: acc.due_date || acc.dueDate || new Date().toISOString().split('T')[0],
                    status: acc.status || 'pendente'
                };
                mockDb.accounts.push(newAcc);
                saveMock();
                return newAcc;
            }
        }

        const { id, type, description, client_id, amount, status } = acc;
        const dueDate = acc.due_date || acc.dueDate;
        if (id) {
            const res = await pool.query(`
                UPDATE accounts SET description=$1, amount=$2, due_date=$3, status=$4
                WHERE id=$5 AND company_id=$6 RETURNING *
            `, [description, amount, dueDate || null, status, id, companyId]);
            return res.rows[0];
        } else {
            const res = await pool.query(`
                INSERT INTO accounts (company_id, type, description, client_id, amount, due_date, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
            `, [companyId, type, description || acc.desc, client_id, amount, dueDate || null, status || 'pendente']);
            return res.rows[0];
        }
    },

    async deleteAccountByDesc(companyId, descSubstring) {
        if (useMock) {
            const idx = mockDb.accounts.findIndex(a => a.description.includes(descSubstring) && a.company_id === Number(companyId));
            if (idx !== -1) {
                mockDb.accounts.splice(idx, 1);
                saveMock();
                return true;
            }
            return false;
        }
        const res = await pool.query('DELETE FROM accounts WHERE company_id = $1 AND description LIKE $2', [companyId, `%${descSubstring}%`]);
        return res.rowCount > 0;
    },

    async deleteTransaction(companyId, id) {
        if (useMock) {
            const idx = mockDb.transactions.findIndex(t => t.id === Number(id) && t.company_id === Number(companyId));
            if (idx !== -1) {
                mockDb.transactions.splice(idx, 1);
                saveMock();
                return true;
            }
            return false;
        }
        const res = await pool.query('DELETE FROM transactions WHERE id = $1 AND company_id = $2', [id, companyId]);
        return res.rowCount > 0;
    },

    async deleteAccount(companyId, id) {
        if (useMock) {
            const idx = mockDb.accounts.findIndex(a => a.id === Number(id) && a.company_id === Number(companyId));
            if (idx !== -1) {
                mockDb.accounts.splice(idx, 1);
                saveMock();
                return true;
            }
            return false;
        }
        const res = await pool.query('DELETE FROM accounts WHERE id = $1 AND company_id = $2', [id, companyId]);
        return res.rowCount > 0;
    },

    async registerTenant(companyName, cnpj, adminName, username, password) {
        const hashedPw = bcrypt.hashSync(password, 10);

        if (useMock) {
            if (mockDb.users.some(u => u.username === username.trim().toLowerCase())) {
                throw new Error('Este login de usuário já está cadastrado.');
            }

            const newCompanyId = mockDb.companies.length ? Math.max(...mockDb.companies.map(c => c.id)) + 1 : 1;
            const newCompany = {
                id: newCompanyId,
                name: companyName,
                cnpj: cnpj || '',
                phone: '',
                address: '',
                markup: 30.00,
                wa_mode: 'link',
                wa_endpoint: '',
                wa_token: '',
                logo_base64: '',
                footer_message: 'Obrigado pela preferência!'
            };
            mockDb.companies.push(newCompany);

            const newUserId = mockDb.users.length ? Math.max(...mockDb.users.map(u => u.id)) + 1 : 1;
            const newUser = {
                id: newUserId,
                company_id: newCompanyId,
                name: adminName,
                username: username.trim().toLowerCase(),
                password: hashedPw,
                role: 'admin'
            };
            mockDb.users.push(newUser);

            const newClient = {
                id: 'c_' + Date.now(),
                company_id: newCompanyId,
                name: 'Consumidor Geral',
                doc: '',
                phone: '',
                email: '',
                balance: 0.00
            };
            mockDb.clients.push(newClient);

            saveMock();
            return { company: newCompany, user: newUser };
        }

        const checkUser = await pool.query('SELECT id FROM users WHERE username = $1', [username.trim().toLowerCase()]);
        if (checkUser.rows.length > 0) {
            throw new Error('Este login de usuário já está cadastrado.');
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const compRes = await client.query(`
                INSERT INTO companies (name, cnpj, markup, wa_mode, footer_message)
                VALUES ($1, $2, 30.00, 'link', 'Obrigado pela preferência!')
                RETURNING id, name, cnpj
            `, [companyName, cnpj || '']);
            const company = compRes.rows[0];

            const userRes = await client.query(`
                INSERT INTO users (company_id, name, username, password, role)
                VALUES ($1, $2, $3, $4, 'admin')
                RETURNING id, company_id, name, username, role
            `, [company.id, adminName, username.trim().toLowerCase(), hashedPw]);
            const user = userRes.rows[0];

            await client.query(`
                INSERT INTO clients (id, company_id, name, balance)
                VALUES ($1, $2, 'Consumidor Geral', 0.00)
            `, ['c_' + Date.now(), company.id]);

            await client.query('COMMIT');
            return { company, user };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
};
