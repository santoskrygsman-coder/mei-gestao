// js/database.js
// Cliente SDK para conectar o Frontend do MEI Fácil Gestão à API Backend

const API_URL = window.location.origin.includes('localhost:8082')
    ? 'http://localhost:3000'  // Desenvolvimento local (Portas separadas)
    : window.location.origin; // Produção (Front e Back unificados na mesma origem)

export const db = {
    // Inicialização - O backend gerencia o banco de dados agora
    init() {
        console.log('🔌 [DB-CLIENT] Inicializado cliente de conexão à API em ' + API_URL);
    },

    // --- REQUISIÇÕES HTTP CENTRAIS COM TRATAMENTO DE JWT ---
    async request(method, path, body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = sessionStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method,
            headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_URL}${path}`, options);

            // Redireciona para login ou bloqueio em caso de token expirado ou licença vencida
            if (response.status === 401 || response.status === 403) {
                const errData = await response.json().catch(() => ({}));
                
                if (response.status === 403 && errData.isExpired) {
                    console.warn('⚠️ Assinatura suspensa ou expirada. Exibindo tela de bloqueio.');
                    window.dispatchEvent(new CustomEvent('subscription-expired', { detail: errData }));
                    throw new Error(errData.error || 'Sua assinatura expirou.');
                }

                console.warn('⚠️ Sessão expirada ou não autorizada. Redirecionando para login.');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('loggedUser');
                const loginOverlay = document.getElementById('login-overlay');
                const appShell = document.getElementById('app-shell');
                if (loginOverlay) loginOverlay.style.display = 'flex';
                if (appShell) appShell.style.display = 'none';
                throw new Error('Sessão expirada. Faça login novamente.');
            }

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Erro de rede: Código ${response.status}`);
            }

            return await response.json();
        } catch (e) {
            console.error(`❌ Erro na requisição [${method}] ${path}:`, e.message);
            throw e;
        }
    },

    // --- AUTENTICAÇÃO ---
    async login(username, password) {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Usuário ou senha incorretos.');
        }
        return await response.json();
    },

    async register(companyName, cnpj, adminName, username, password) {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyName, cnpj, adminName, username, password })
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Falha ao registrar empresa.');
        }
        return await response.json();
    },

    // --- CONFIGURAÇÃO ---
    async getConfig() {
        return await this.request('GET', '/api/config');
    },

    async saveConfig(config) {
        return await this.request('POST', '/api/config', config);
    },

    // --- USUÁRIOS ---
    async getUsers() {
        return await this.request('GET', '/api/users');
    },

    async saveUser(user) {
        return await this.request('POST', '/api/users', user);
    },

    async deleteUser(id) {
        return await this.request('DELETE', `/api/users/${id}`);
    },

    // --- PRODUTOS ---
    async getProducts() {
        return await this.request('GET', '/api/products');
    },

    async saveProduct(product) {
        return await this.request('POST', '/api/products', product);
    },

    async deleteProduct(id) {
        return await this.request('DELETE', `/api/products/${id}`);
    },

    async adjustStock(productId, qtyDelta) {
        return await this.request('POST', '/api/products/stock-adjust', { id: productId, qty: qtyDelta });
    },

    async registerPurchaseStock(productId, qtyPurchased, unitCost, updateSellingPrice, newSellingPrice) {
        const products = await this.getProducts();
        const p = products.find(prod => prod.id === productId);
        if (p) {
            const currentStock = Number(p.stock || 0);
            const currentCost = Number(p.cost || 0);

            // Recalcula Custo Médio Ponderado
            let newCost = currentCost;
            const totalQty = currentStock + qtyPurchased;
            if (totalQty > 0) {
                newCost = parseFloat(((currentStock * currentCost) + (qtyPurchased * unitCost)) / totalQty).toFixed(4);
                newCost = parseFloat(newCost);
            } else {
                newCost = unitCost;
            }

            p.stock = totalQty;
            p.cost = newCost;
            if (updateSellingPrice && newSellingPrice > 0) {
                p.price = newSellingPrice;
            }

            await this.saveProduct(p);

            // Registra despesa no fluxo
            await this.addTransaction({
                type: 'despesa',
                desc: `Compra de Estoque: ${qtyPurchased}x ${p.name}`,
                amount: parseFloat((qtyPurchased * unitCost).toFixed(2)),
                category: 'Estoque/Mercadoria'
            });

            return p;
        }
        return null;
    },

    async processPurchase(productId, qtyPurchased, unitCost, updateSellingPrice, newSellingPrice) {
        return await this.registerPurchaseStock(productId, qtyPurchased, unitCost, updateSellingPrice, newSellingPrice);
    },

    // --- CLIENTES ---
    async getClients() {
        return await this.request('GET', '/api/clients');
    },

    async saveClient(client) {
        return await this.request('POST', '/api/clients', client);
    },

    async updateClientBalance(clientId, amount) {
        return await this.request('POST', `/api/clients/${clientId}/balance`, { amount });
    },

    async saveClientPayment(clientId, amountPaid, method) {
        return await this.request('POST', '/api/clients/payment', { clientId, amount: amountPaid, method });
    },

    async deleteClient(id) {
        return await this.request('DELETE', `/api/clients/${id}`);
    },

    // --- DOCUMENTOS ---
    async getDocuments() {
        return await this.request('GET', '/api/documents');
    },

    async saveDocument(doc) {
        return await this.request('POST', '/api/documents', doc);
    },

    async cancelDocument(id) {
        return await this.request('POST', `/api/documents/${id}/cancel`);
    },

    // --- TRANSAÇÕES (Caixa) ---
    async getTransactions() {
        return await this.request('GET', '/api/transactions');
    },

    async addTransaction(transaction) {
        return await this.request('POST', '/api/transactions', transaction);
    },

    // --- CONTAS A PAGAR / RECEBER ---
    async getAccounts() {
        return await this.request('GET', '/api/accounts');
    },

    async saveAccount(account) {
        return await this.request('POST', '/api/accounts', account);
    },

    async payAccount(id) {
        const accounts = await this.getAccounts();
        const acc = accounts.find(a => String(a.id) === String(id));
        if (acc) {
            acc.status = 'pago';
            await this.saveAccount(acc);

            const isReceivable = acc.type === 'receber';
            await this.addTransaction({
                type: isReceivable ? 'receita' : 'despesa',
                desc: `${isReceivable ? 'Receb.' : 'Pagam.'} de Título: ${acc.description || acc.desc}`,
                amount: acc.amount,
                category: isReceivable ? 'Fiado' : 'Contas Pagas'
            });

            if (isReceivable && acc.client_id) {
                await this.updateClientBalance(acc.client_id, acc.amount);
            }
        }
    },

    // --- BACKUP & EXPORT (Usado localmente pelo Admin) ---
    async getBackupData() {
        const [products, clients, documents, transactions, accounts, users] = await Promise.all([
            this.getProducts(),
            this.getClients(),
            this.getDocuments(),
            this.getTransactions(),
            this.getAccounts(),
            this.getUsers().catch(() => []) // Usuários exige Admin
        ]);

        return JSON.stringify({
            products,
            clients,
            documents,
            transactions,
            accounts,
            users
        }, null, 2);
    },

    async importData(jsonData) {
        // Envia cada registro do backup JSON para a API correspondente
        try {
            const data = JSON.parse(jsonData);
            
            if (data.products && data.products.length) {
                for (const p of data.products) {
                    await this.saveProduct(p);
                }
            }
            if (data.clients && data.clients.length) {
                for (const c of data.clients) {
                    await this.saveClient(c);
                    if (c.balance !== 0) {
                        await this.updateClientBalance(c.id, c.balance);
                    }
                }
            }
            if (data.documents && data.documents.length) {
                for (const d of data.documents) {
                    // Evita disparar novamente baixa de estoque no import, salvando direto
                    // (O import restabelece o backup exatamente como estava)
                    await this.request('POST', '/api/documents', d);
                }
            }
            if (data.transactions && data.transactions.length) {
                for (const t of data.transactions) {
                    await this.addTransaction(t);
                }
            }
            if (data.accounts && data.accounts.length) {
                for (const a of data.accounts) {
                    await this.saveAccount(a);
                }
            }
            if (data.users && data.users.length) {
                for (const u of data.users) {
                    await this.saveUser(u);
                }
            }
            return true;
        } catch (e) {
            console.error("Erro na importação dos dados", e);
            return false;
        }
    }
};
