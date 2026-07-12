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
    showAlert(message, title = 'Aviso') {
        return new Promise(resolve => {
            document.getElementById('custom-dialog-title').innerHTML = title;
            document.getElementById('custom-dialog-message').innerHTML = String(message).replace(/\n/g, '<br>');
            const inputField = document.getElementById('custom-dialog-input');
            if (inputField) inputField.style.display = 'none';
            
            const footer = document.getElementById('custom-dialog-footer');
            footer.innerHTML = `<button class="btn btn-primary" id="btn-custom-dialog-ok">OK</button>`;
            
            const overlay = document.getElementById('modal-custom-dialog');
            const btnOk = document.getElementById('btn-custom-dialog-ok');
            
            const close = () => {
                overlay.classList.remove('active');
                btnOk.removeEventListener('click', close);
                resolve();
            };
            
            btnOk.addEventListener('click', close);
            overlay.classList.add('active');
            setTimeout(() => btnOk.focus(), 50);
        });
    },

    showConfirm(message, title = 'Confirmação') {
        return new Promise(resolve => {
            document.getElementById('custom-dialog-title').innerHTML = title;
            document.getElementById('custom-dialog-message').innerHTML = String(message).replace(/\n/g, '<br>');
            const inputField = document.getElementById('custom-dialog-input');
            if (inputField) inputField.style.display = 'none';
            
            const footer = document.getElementById('custom-dialog-footer');
            footer.innerHTML = `
                <button class="btn btn-secondary" id="btn-custom-dialog-cancel">Cancelar</button>
                <button class="btn btn-primary" id="btn-custom-dialog-confirm">Confirmar</button>
            `;
            
            const overlay = document.getElementById('modal-custom-dialog');
            const btnConfirm = document.getElementById('btn-custom-dialog-confirm');
            const btnCancel = document.getElementById('btn-custom-dialog-cancel');
            
            const close = (result) => {
                overlay.classList.remove('active');
                btnConfirm.removeEventListener('click', onConfirm);
                btnCancel.removeEventListener('click', onCancel);
                resolve(result);
            };
            
            const onConfirm = () => close(true);
            const onCancel = () => close(false);
            
            btnConfirm.addEventListener('click', onConfirm);
            btnCancel.addEventListener('click', onCancel);
            
            overlay.classList.add('active');
            setTimeout(() => btnConfirm.focus(), 50);
        });
    },

    showPrompt(message, title = 'Entrada de Dados') {
        return new Promise(resolve => {
            document.getElementById('custom-dialog-title').innerHTML = title;
            document.getElementById('custom-dialog-message').innerHTML = String(message).replace(/\n/g, '<br>');
            
            let inputField = document.getElementById('custom-dialog-input');
            if (!inputField) {
                inputField = document.createElement('input');
                inputField.type = 'text';
                inputField.id = 'custom-dialog-input';
                inputField.className = 'form-control';
                inputField.style.marginTop = '10px';
                inputField.style.width = '100%';
                document.getElementById('custom-dialog-message').parentNode.appendChild(inputField);
            }
            inputField.style.display = 'block';
            inputField.value = '';
            
            const footer = document.getElementById('custom-dialog-footer');
            footer.innerHTML = `
                <button class="btn btn-secondary" id="btn-custom-dialog-cancel">Cancelar</button>
                <button class="btn btn-primary" id="btn-custom-dialog-confirm">OK</button>
            `;
            
            const overlay = document.getElementById('modal-custom-dialog');
            
            const close = (result) => {
                overlay.classList.remove('active');
                inputField.style.display = 'none';
                resolve(result);
            };
            
            document.getElementById('btn-custom-dialog-cancel').addEventListener('click', () => close(null));
            document.getElementById('btn-custom-dialog-confirm').addEventListener('click', () => close(inputField.value));
            
            inputField.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    close(inputField.value);
                }
            };
            
            overlay.classList.add('active');
            setTimeout(() => inputField.focus(), 100);
        });
    },

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

        // Alternância de Telas Login / Cadastro
        const linkShowRegister = document.getElementById('link-show-register');
        const linkShowLogin = document.getElementById('link-show-login');
        const loginCard = document.getElementById('login-card');
        const registerCard = document.getElementById('register-card');

        if (linkShowRegister && linkShowLogin && loginCard && registerCard) {
            linkShowRegister.addEventListener('click', (e) => {
                e.preventDefault();
                loginCard.style.display = 'none';
                registerCard.style.display = 'block';
            });
            linkShowLogin.addEventListener('click', (e) => {
                e.preventDefault();
                registerCard.style.display = 'none';
                loginCard.style.display = 'block';
            });
        }

        const formRegister = document.getElementById('form-register');
        if (formRegister) {
            formRegister.addEventListener('submit', (e) => this.handleRegisterSubmit(e));
        }

        // Evento de Assinatura Expirada (Exibe tela de bloqueio)
        window.addEventListener('subscription-expired', (e) => {
            const billingOverlay = document.getElementById('billing-overlay');
            const loginOverlay = document.getElementById('login-overlay');
            const appShell = document.getElementById('app-shell');
            
            if (billingOverlay) {
                const dateVal = e.detail && e.detail.expirationDate;
                const formattedDate = this.formatDate(dateVal);
                document.getElementById('billing-expiry-date').textContent = formattedDate;
                billingOverlay.style.display = 'flex';
            }
            if (loginOverlay) loginOverlay.style.display = 'none';
            if (appShell) appShell.style.display = 'none';
        });

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

        // Configura máscaras de inputs em tempo real (CPF, CNPJ e Telefones)
        const applyMask = (elementId, maskFunc) => {
            const el = document.getElementById(elementId);
            if (el) {
                el.addEventListener('input', (e) => {
                    const cursor = e.target.selectionStart;
                    const oldLen = e.target.value.length;
                    e.target.value = maskFunc(e.target.value);
                    const newLen = e.target.value.length;
                    e.target.setSelectionRange(cursor + (newLen - oldLen), cursor + (newLen - oldLen));
                });
            }
        };

        applyMask('reg-cnpj', this.formatDocument);
        applyMask('cfg-cnpj', this.formatDocument);
        applyMask('cli-doc', this.formatDocument);
        applyMask('cfg-phone', this.formatPhone);
        applyMask('cli-phone', this.formatPhone);

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
            this.checkUpdateNotes();
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
                
                // Agendar para o próximo minuto exato
                const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
                setTimeout(updateClock, msUntilNextMinute);
            }
        };
        updateClock();
    },

    async updateNotificationsBadge() {
        try {
            let count = 0;
            
            // 1. Estoque Zerado
            const products = await db.getProducts();
            const criticalProducts = products.filter(p => p.stock <= 0);
            if (criticalProducts.length > 0) count++;
            // 2. Limite MEI Anual
            const transactions = await db.getTransactions();
            const currentYear = new Date().getFullYear();
            const receitasAno = transactions
                .filter(t => t.type === 'receita' && new Date(String(t.date).split('T')[0] + 'T12:00:00').getFullYear() === currentYear)
                .reduce((sum, t) => sum + t.amount, 0);
            
            if (receitasAno >= 81000 * 0.9) {
                count++;
            }

            // 3. Notas de Atualização
            const LAST_UPDATE = '2026-07-10-v3.1.0';
            const seenUpdate = localStorage.getItem('update_seen_date');
            if (seenUpdate !== LAST_UPDATE) count++;

            const badge = document.getElementById('notifications-badge');
            if (badge) {
                if (count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'block';
                    badge.style.animation = 'pulse-danger 2s infinite';
                } else {
                    badge.style.display = 'none';
                    badge.style.animation = 'none';
                }
            }
        } catch (e) {
            console.error('Erro ao atualizar alertas:', e);
        }
    },

    async openNotifications() {
        const listDiv = document.getElementById('notifications-list');
        if (!listDiv) return;
        
        listDiv.innerHTML = '<div style="text-align: center; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Carregando...</div>';
        this.openModal('modal-notifications');

        try {
            const alerts = [];
            
            // 1. Atualizações
            const LAST_UPDATE = '2026-07-10-v3.1.0';
            const seenUpdate = localStorage.getItem('update_seen_date');
            if (seenUpdate !== LAST_UPDATE) {
                alerts.push(`
                    <div class="glass-card" style="border-left: 4px solid var(--primary);">
                        <h4 style="margin: 0 0 0.5rem 0; color: var(--primary);"><i class="fa-solid fa-star"></i> Nova Atualização Disponível!</h4>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted);">Uma nova versão do sistema com melhorias está disponível. <a href="#" onclick="app.closeModal('modal-notifications'); app.openModal('modal-update-notes'); return false;" style="color: var(--primary); font-weight: 500;">Ler Notas de Atualização</a>.</p>
                    </div>
                `);
            }

            // 2. Limite MEI
            const transactions = await db.getTransactions();
            const currentYear = new Date().getFullYear();
            const receitasAno = transactions
                .filter(t => t.type === 'receita' && new Date(String(t.date).split('T')[0] + 'T12:00:00').getFullYear() === currentYear)
                .reduce((sum, t) => sum + t.amount, 0);

            if (receitasAno >= 81000 * 1.2) {
                alerts.push(`
                    <div class="glass-card" style="border-left: 4px solid #991b1b; background: rgba(153, 27, 27, 0.05);">
                        <h4 style="margin: 0 0 0.5rem 0; color: #991b1b;"><i class="fa-solid fa-triangle-exclamation"></i> MEI Estourado (>20%)</h4>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted);">Você faturou <strong>${app.formatCurrency(receitasAno)}</strong>, excedendo o limite em mais de 20%. Isso gera <strong>desenquadramento retroativo</strong> a janeiro. Procure um contador urgente!</p>
                    </div>
                `);
            } else if (receitasAno > 81000) {
                alerts.push(`
                    <div class="glass-card" style="border-left: 4px solid #f97316;">
                        <h4 style="margin: 0 0 0.5rem 0; color: #f97316;"><i class="fa-solid fa-triangle-exclamation"></i> Limite MEI Ultrapassado!</h4>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted);">Você faturou <strong>${app.formatCurrency(receitasAno)}</strong> (até 20% acima do limite). Você será desenquadrado no ano que vem e pagará multa sobre o excesso.</p>
                    </div>
                `);
            } else if (receitasAno >= 81000 * 0.9) {
                alerts.push(`
                    <div class="glass-card" style="border-left: 4px solid var(--warning);">
                        <h4 style="margin: 0 0 0.5rem 0; color: var(--warning);"><i class="fa-solid fa-circle-exclamation"></i> Limite MEI Próximo!</h4>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted);">Você já faturou <strong>${app.formatCurrency(receitasAno)}</strong> neste ano, atingindo mais de 90% do limite do MEI (R$ 81.000,00).</p>
                    </div>
                `);
            }

            // 3. Estoque Zerado
            const products = await db.getProducts();
            const criticalProducts = products.filter(p => p.stock <= 0);
            if (criticalProducts.length > 0) {
                alerts.push(`
                    <div class="glass-card" style="border-left: 4px solid var(--danger);">
                        <h4 style="margin: 0 0 0.5rem 0; color: var(--danger);"><i class="fa-solid fa-box-open"></i> Produtos sem Estoque</h4>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted);">Você possui <strong>${criticalProducts.length}</strong> produto(s) com estoque zerado no momento. <a href="#" onclick="app.closeModal('modal-notifications'); app.switchView('estoque'); return false;" style="color: var(--primary); font-weight: 500;">Ver Estoque</a>.</p>
                    </div>
                `);
            }

            if (alerts.length === 0) {
                listDiv.innerHTML = `
                    <div style="text-align: center; color: var(--text-muted); padding: 2rem 0;">
                        <i class="fa-regular fa-bell-slash" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p style="margin: 0;">Tudo certo! Você não tem novas notificações no momento.</p>
                    </div>
                `;
            } else {
                listDiv.innerHTML = alerts.join('');
            }

        } catch (e) {
            listDiv.innerHTML = `<div style="color: var(--danger);">Erro ao carregar notificações: ${e.message}</div>`;
        }
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
                await app.showAlert('Acesso negado: Apenas administradores possuem permissão para esta seção.');
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
            this.updateNotificationsBadge();
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

    checkUpdateNotes() {
        this.updateNotificationsBadge();
    },
    
    closeUpdateNotes() {
        this.closeModal('modal-update-notes');
        const LAST_UPDATE = '2026-07-10-v3.1.0';
        localStorage.setItem('update_seen_date', LAST_UPDATE);
        this.updateNotificationsBadge();
    },

    async generatePDF(containerId, filename) {
        const element = document.getElementById(containerId);
        if (!element) return;
        
        // Configurações do html2pdf
        const opt = {
            margin:       10,
            filename:     filename || 'documento.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // window.html2pdf deve estar disponível pelo CDN
        if (typeof html2pdf !== 'undefined') {
            html2pdf().set(opt).from(element).save();
        } else {
            await app.showAlert('A biblioteca de PDF ainda não foi carregada. Tente novamente em alguns segundos.');
        }
    },

    // --- GLOBAL EVENTS SETUP ---
    setupGlobalEvents() {


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

    formatDocument(value) {
        if (!value) return '';
        let clean = value.replace(/\D/g, '');
        if (clean.length <= 11) {
            clean = clean.replace(/(\d{3})(\d)/, '$1.$2');
            clean = clean.replace(/(\d{3})(\d)/, '$1.$2');
            clean = clean.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            return clean;
        } else {
            clean = clean.substring(0, 14);
            clean = clean.replace(/^(\d{2})(\d)/, '$1.$2');
            clean = clean.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            clean = clean.replace(/\.(\d{3})(\d)/, '.$1/$2');
            clean = clean.replace(/(\d{4})(\d)/, '$1-$2');
            return clean;
        }
    },

    formatPhone(value) {
        if (!value) return '';
        let clean = value.replace(/\D/g, '');
        clean = clean.substring(0, 11);
        if (clean.length <= 10) {
            clean = clean.replace(/^(\d{2})(\d)/g, '($1) $2');
            clean = clean.replace(/(\d{4})(\d)/, '$1-$2');
            return clean;
        } else {
            clean = clean.replace(/^(\d{2})(\d)/g, '($1) $2');
            clean = clean.replace(/(\d{5})(\d)/, '$1-$2');
            return clean;
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
                .then(async response => {
                    if (response.ok) {
                        await app.showAlert('Comprovante enviado com sucesso via WhatsApp!');
                    } else {
                        throw new Error('Falha no envio do servidor de WhatsApp.');
                    }
                })
                .catch(async err => {
                    console.error('Falha no envio via API', err);
                    if (await app.showConfirm('O envio automático falhou. Deseja abrir pelo método clássico (Link do Navegador)?')) {
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
        const billingOverlay = document.getElementById('billing-overlay');

        if (!loggedUser) {
            if (loginOverlay) loginOverlay.style.display = 'flex';
            if (appShell) appShell.style.display = 'none';
            if (billingOverlay) billingOverlay.style.display = 'none';
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
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        if (btnSubmit) btnSubmit.disabled = true;
        
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
                this.checkUpdateNotes();
                if (app.tour) app.tour.checkAndStartGeneralTour();
            } else {
                if (errorMsg) errorMsg.style.display = 'block';
            }
        } catch (err) {
            console.error('Falha ao autenticar:', err);
            if (errorMsg) errorMsg.style.display = 'block';
        } finally {
            if (btnSubmit) btnSubmit.disabled = false;
        }
    },

    async handleRegisterSubmit(e) {
        e.preventDefault();
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        if (btnSubmit) btnSubmit.disabled = true;

        const companyName = document.getElementById('reg-company-name').value.trim();
        const cnpj = document.getElementById('reg-cnpj').value.trim();
        const adminName = document.getElementById('reg-admin-name').value.trim();
        const username = document.getElementById('reg-username').value.trim().toLowerCase();
        const password = document.getElementById('reg-password').value.trim();
        const errorMsg = document.getElementById('register-error-msg');

        try {
            const regResult = await db.register(companyName, cnpj, adminName, username, password);
            if (regResult) {
                await app.showAlert('Sua empresa foi cadastrada com sucesso! Inicializando painel de controle...');
                const loginRes = await db.login(username, password);
                if (loginRes && loginRes.token) {
                    sessionStorage.setItem('token', loginRes.token);
                    sessionStorage.setItem('loggedUser', JSON.stringify(loginRes.user));
                    
                    if (errorMsg) errorMsg.style.display = 'none';
                    document.getElementById('form-register').reset();
                    
                    // Reseta telas e volta ao Login oculto
                    document.getElementById('register-card').style.display = 'none';
                    document.getElementById('login-card').style.display = 'block';
                    
                    this.checkLoginStatus();
                    await this.switchView('dashboard');
                    if (app.tour) app.tour.checkAndStartGeneralTour();
                }
            }
        } catch (err) {
            console.error('Falha ao registrar inquilino:', err);
            if (errorMsg) {
                errorMsg.textContent = err.message || 'Falha ao registrar empresa.';
                errorMsg.style.display = 'block';
            }
        } finally {
            if (btnSubmit) btnSubmit.disabled = false;
        }
    },

    handleLogout() {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('loggedUser');
        const billingOverlay = document.getElementById('billing-overlay');
        if (billingOverlay) billingOverlay.style.display = 'none';
        this.checkLoginStatus();
    }
};
