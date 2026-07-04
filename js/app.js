// js/app.js

import { db } from './database.js';
import { dashboard } from './dashboard.js';
import { pdv } from './pdv.js';
import { estoque } from './estoque.js';
import { clientes } from './clientes.js';
import { documentos } from './documentos.js';
import { financeiro } from './financeiro.js';
import { relatorios } from './relatorios.js';
import { configuracoes } from './configuracoes.js';

export const app = {
    currentView: 'dashboard',
    dashboard,
    pdv,
    estoque,
    clientes,
    documentos,
    financeiro,
    relatorios,
    configuracoes,

    init() {
        this.startClock();

        const formLogin = document.getElementById('form-login');
        if (formLogin) {
            formLogin.addEventListener('submit', (e) => this.handleLoginSubmit(e));
        }

        const btnTogglePassword = document.getElementById('btn-toggle-password');
        const loginPasswordInput = document.getElementById('login-password');
        const passwordToggleIcon = document.getElementById('password-toggle-icon');

        if (btnTogglePassword && loginPasswordInput && passwordToggleIcon) {
            btnTogglePassword.addEventListener('click', () => {
                if (loginPasswordInput.type === 'password') {
                    loginPasswordInput.type = 'text';
                    passwordToggleIcon.classList.remove('fa-eye');
                    passwordToggleIcon.classList.add('fa-eye-slash');
                } else {
                    loginPasswordInput.type = 'password';
                    passwordToggleIcon.classList.remove('fa-eye-slash');
                    passwordToggleIcon.classList.add('fa-eye');
                }
            });
        }

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => this.handleLogout());
        }

        this.checkLoginStatus();

        // Controle do Menu Hambúrguer (Mobile)
        const btnMenuToggle = document.getElementById('btn-menu-toggle');
        const sidebar = document.querySelector('aside');
        const backdrop = document.getElementById('sidebar-backdrop');

        if (btnMenuToggle && sidebar && backdrop) {
            btnMenuToggle.addEventListener('click', () => {
                sidebar.classList.add('mobile-open');
                backdrop.style.display = 'block';
            });

            backdrop.addEventListener('click', () => {
                sidebar.classList.remove('mobile-open');
                backdrop.style.display = 'none';
            });
        }

        this.setupNavigation();
        this.setupGlobalEvents();

        dashboard.init();
        pdv.init();
        estoque.init();
        clientes.init();
        documentos.init();
        financeiro.init();
        relatorios.init();
        configuracoes.init();

        const loggedUser = sessionStorage.getItem('loggedUser');
        if (loggedUser) {
            this.switchView('dashboard');
        }
    },

    startClock() {
        const updateClock = () => {
            const el = document.getElementById('header-clock');
            if (el) {
                const now = new Date();
                const day = String(now.getDate()).padStart(2, '0');
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const year = now.getFullYear();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                el.textContent = `${day}/${month}/${year} ${hours}:${minutes}`;
            }
        };
        updateClock();
        setInterval(updateClock, 60000);
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const sidebar = document.querySelector('aside');
        const backdrop = document.getElementById('sidebar-backdrop');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                if (view) {
                    this.switchView(view);
                    
                    if (sidebar && sidebar.classList.contains('mobile-open')) {
                        sidebar.classList.remove('mobile-open');
                        if (backdrop) backdrop.style.display = 'none';
                    }
                }
            });
        });
    },

    async switchView(viewName) {
        const loggedUser = JSON.parse(sessionStorage.getItem('loggedUser'));
        if (loggedUser) {
            const adminViews = ['financeiro', 'relatorios', 'configuracoes'];
            if (adminViews.includes(viewName) && loggedUser.role !== 'admin') {
                alert('Acesso negado: Apenas administradores possuem permissão para esta seção.');
                return;
            }
        }

        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.remove('active');
        });
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const targetView = document.getElementById(`${viewName}-view`);
        const targetNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);
        
        if (targetView && targetNav) {
            targetView.classList.add('active');
            targetNav.classList.add('active');
            this.currentView = viewName;

            const titleEl = document.getElementById('view-title');
            const viewTitles = {
                dashboard: 'Painel de Controle',
                pdv: 'Frente de Caixa (PDV)',
                estoque: 'Gestão de Estoque e Compras',
                clientes: 'Controle de Clientes',
                documentos: 'Orçamentos e Condicionais',
                financeiro: 'Fluxo de Caixa e Finanças',
                relatorios: 'Relatórios Gerenciais',
                configuracoes: 'Configurações do Sistema'
            };
            titleEl.textContent = viewTitles[viewName] || 'Sistema MEI';

            await this.onViewFocus(viewName);
        }
    },

    async onViewFocus(viewName) {
        try {
            switch (viewName) {
                case 'dashboard':
                    await dashboard.render();
                    break;
                case 'pdv':
                    await pdv.render();
                    break;
                case 'estoque':
                    await estoque.render();
                    break;
                case 'clientes':
                    await clientes.render();
                    break;
                case 'documentos':
                    await documentos.render();
                    break;
                case 'financeiro':
                    await financeiro.render();
                    break;
                case 'relatorios':
                    await relatorios.render();
                    break;
                case 'configuracoes':
                    await configuracoes.render();
                    break;
            }
        } catch (err) {
            console.error('Erro ao focar na view: ' + viewName, err);
        }
    },

    // --- MODAL UTILITIES ---
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            if (modalId === 'modal-receipt') {
                document.body.classList.add('modal-open-receipt');
            }
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            if (modalId === 'modal-receipt') {
                document.body.classList.remove('modal-open-receipt');
            }
        }
    },

    // --- GLOBAL EVENTS SETUP ---
    setupGlobalEvents() {
        // Modal de Backup / Dados
        const btnBackup = document.getElementById('btn-backup-modal');
        if (btnBackup) {
            btnBackup.addEventListener('click', () => this.openModal('modal-backup'));
        }

        // Exportar Backup
        const btnExport = document.getElementById('btn-export-backup');
        if (btnExport) {
            btnExport.addEventListener('click', async () => {
                try {
                    const dataStr = await db.getBackupData();
                    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                    
                    const exportFileDefaultName = `backup_mei_gestao_${new Date().toISOString().split('T')[0]}.json`;
                    
                    const linkElement = document.createElement('a');
                    linkElement.setAttribute('href', dataUri);
                    linkElement.setAttribute('download', exportFileDefaultName);
                    linkElement.click();
                } catch (e) {
                    alert('Erro ao exportar backup: ' + e.message);
                }
            });
        }

        // Importar Backup
        const inputImport = document.getElementById('input-import-backup');
        if (inputImport) {
            inputImport.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const success = await db.importData(event.target.result);
                    if (success) {
                        alert('Dados restaurados com sucesso! O sistema será recarregado.');
                        window.location.reload();
                    } else {
                        alert('Falha ao restaurar dados. Verifique se o arquivo JSON é válido.');
                    }
                };
                reader.readAsText(file);
            });
        }

        // Ações rápidas do Dashboard
        const btnCompraRapida = document.getElementById('btn-compra-rapida');
        if (btnCompraRapida) {
            btnCompraRapida.addEventListener('click', () => {
                this.switchView('estoque');
                estoque.openPurchaseModal();
            });
        }

        const btnCondicionalRapido = document.getElementById('btn-condicional-rapido');
        if (btnCondicionalRapido) {
            btnCondicionalRapido.addEventListener('click', () => {
                this.switchView('pdv');
                // Foca na aba de cliente e deixa pronto para Condicional
                document.getElementById('pdv-client-select').focus();
            });
        }
    },

    // --- GLOBAL FORMATTERS ---
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    },

    formatDate(dateVal) {
        if (!dateVal) return '---';
        try {
            if (dateVal instanceof Date) {
                return dateVal.toLocaleDateString('pt-BR');
            }
            const dateStr = String(dateVal);
            if (dateStr.includes('T') || dateStr.includes('Z')) {
                const d = new Date(dateStr);
                if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
            }
            if (dateStr.length === 10 && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
            }
            const d = new Date(dateStr);
            return !isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR') : '---';
        } catch (e) {
            console.error('Erro ao formatar data:', e);
            return '---';
        }
    },

    // Simula sinal sonoro e efeito visual de leitura de código de barras
    triggerBeep() {
        const flash = document.getElementById('scanner-flash');
        if (flash) {
            flash.classList.add('flash');
            setTimeout(() => flash.classList.remove('flash'), 150);
        }

        // Beep Sintético com Web Audio API
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1400, audioCtx.currentTime); // Beep agudo de scanner
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.08); // 80ms de duração
        } catch (err) {
            console.log('Audio API não suportada ou permissão negada', err);
        }
    },

    async sendReceiptWhatsApp(doc) {
        if (!doc) return;

        try {
            const clients = await db.getClients();
            const client = clients.find(c => c.id === doc.client_id);
            const rawPhone = client ? (client.phone || '') : '';
            const phone = rawPhone.replace(/\D/g, ''); // Apenas números

            const formattedDate = this.formatDate(doc.date);

            const titleMap = {
                orcamento: 'ORÇAMENTO (SEM VALOR FISCAL)',
                condicional: 'SAÍDA CONDICIONAL (CONTROLE)',
                venda: 'COMPROVANTE DE VENDA'
            };

            const documentTitle = titleMap[doc.type] || 'COMPROVANTE';

            let text = `*${documentTitle}*\n`;
            text += `----------------------------------------\n`;
            text += `*Doc:* ${doc.id} | *Data:* ${formattedDate}\n`;
            text += `*Cliente:* ${doc.client_name}\n`;
            text += `----------------------------------------\n`;
            
            let subtotal = 0;
            doc.items.forEach(item => {
                const itemTotal = item.qty * item.price;
                subtotal += itemTotal;
                text += `• ${item.qty}x ${item.name} - ${this.formatCurrency(itemTotal)}\n`;
            });
            
            text += `----------------------------------------\n`;
            text += `*Subtotal:* ${this.formatCurrency(subtotal)}\n`;
            if (doc.discount > 0) text += `*Desconto:* -${this.formatCurrency(doc.discount)}\n`;
            if (doc.addition > 0) text += `*Acréscimo:* +${this.formatCurrency(doc.addition)}\n`;
            text += `*TOTAL:* *${this.formatCurrency(doc.total)}*\n`;
            
            if (doc.paymentMethod) {
                text += `*Pagamento:* ${doc.paymentMethod}\n`;
            }
            text += `----------------------------------------\n`;
            
            const config = await db.getConfig();
            const footer = config.footer_message || config.footerMessage || 'Obrigado pela preferência!';
            const waMode = config.wa_mode || config.waMode;
            const waEndpoint = config.wa_endpoint || config.waEndpoint;
            const waToken = config.wa_token || config.waToken;
            
            text += `${footer}`;

            const waUrl = `https://api.whatsapp.com/send?phone=${phone ? '55' + phone : ''}&text=${encodeURIComponent(text)}`;
            
            if (waMode === 'api' && waEndpoint) {
                const payload = {
                    phone: '55' + phone,
                    message: text
                };

                const headers = {
                    'Content-Type': 'application/json'
                };
                if (waToken) {
                    headers['Authorization'] = `Bearer ${waToken}`;
                }

                fetch(waEndpoint, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(payload)
                })
                .then(response => {
                    if (response.ok) {
                        alert('Comprovante enviado com sucesso via WhatsApp!');
                    } else {
                        throw new Error('Falha no envio do servidor de WhatsApp.');
                    }
                })
                .catch(err => {
                    console.error('Falha no envio via API', err);
                    if (confirm('O envio automático falhou. Deseja abrir pelo método clássico (Link do Navegador)?')) {
                        window.open(waUrl, '_blank');
                    }
                });
            } else {
                window.open(waUrl, '_blank');
            }
        } catch (e) {
            console.error('Erro ao compartilhar comprovante no WhatsApp:', e);
        }
    },

    checkLoginStatus() {
        const loggedUser = JSON.parse(sessionStorage.getItem('loggedUser'));
        const loginOverlay = document.getElementById('login-overlay');
        const appShell = document.getElementById('app-shell');

        if (!loggedUser) {
            if (loginOverlay) loginOverlay.style.display = 'flex';
            if (appShell) appShell.style.display = 'none';
        } else {
            if (loginOverlay) loginOverlay.style.display = 'none';
            if (appShell) appShell.style.display = 'flex';

            const userDisplay = document.getElementById('sidebar-user-name');
            const roleDisplay = document.getElementById('sidebar-user-role');
            if (userDisplay) userDisplay.textContent = loggedUser.name;
            if (roleDisplay) roleDisplay.textContent = `Perfil: ${loggedUser.role === 'admin' ? 'Administrador' : 'Vendedor'}`;

            document.querySelectorAll('.nav-item').forEach(item => {
                const view = item.getAttribute('data-view');
                const adminViews = ['financeiro', 'relatorios', 'configuracoes'];
                if (adminViews.includes(view)) {
                    item.style.display = loggedUser.role === 'admin' ? 'flex' : 'none';
                }
            });

            const usersSection = document.getElementById('cfg-users-section');
            if (usersSection) {
                usersSection.style.display = loggedUser.role === 'admin' ? 'block' : 'none';
            }
        }
    },

    async handleLoginSubmit(e) {
        e.preventDefault();
        const usernameInput = document.getElementById('login-username').value.trim();
        const passwordInput = document.getElementById('login-password').value.trim();
        const errorMsg = document.getElementById('login-error-msg');

        try {
            const res = await db.login(usernameInput, passwordInput);
            if (res && res.token) {
                sessionStorage.setItem('token', res.token);
                sessionStorage.setItem('loggedUser', JSON.stringify(res.user));
                
                if (errorMsg) errorMsg.style.display = 'none';
                document.getElementById('form-login').reset();
                this.checkLoginStatus();
                await this.switchView('dashboard');
            } else {
                if (errorMsg) errorMsg.style.display = 'block';
            }
        } catch (err) {
            console.error('Falha ao autenticar:', err);
            if (errorMsg) errorMsg.style.display = 'block';
        }
    },

    handleLogout() {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('loggedUser');
        this.checkLoginStatus();
    }
};
