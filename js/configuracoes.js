// js/configuracoes.js

import { db } from './database.js';
import { app } from './app.js';

export const configuracoes = {
    currentLogoBase64: '',

    init() {
        const formCompany = document.getElementById('form-config-company');
        if (formCompany) {
            formCompany.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveCompanyConfig();
            });
        }

        const formWhatsapp = document.getElementById('form-config-whatsapp');
        if (formWhatsapp) {
            formWhatsapp.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveWhatsappConfig();
            });
        }

        const selectWaMode = document.getElementById('cfg-wa-mode');
        if (selectWaMode) {
            selectWaMode.addEventListener('change', (e) => {
                this.toggleWaFields(e.target.value);
            });
        }

        const inputLogo = document.getElementById('cfg-logo');
        if (inputLogo) {
            inputLogo.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.currentLogoBase64 = event.target.result;
                        this.renderLogoPreview(this.currentLogoBase64);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        const btnRemoveLogo = document.getElementById('btn-remove-logo');
        if (btnRemoveLogo) {
            btnRemoveLogo.addEventListener('click', () => {
                this.currentLogoBase64 = '';
                if (inputLogo) inputLogo.value = '';
                this.renderLogoPreview('');
            });
        }

        // Listener do formulário de novos usuários
        const formUser = document.getElementById('form-config-user');
        if (formUser) {
            formUser.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveUserConfig();
            });
        }

        // Faz atualização inicial do layout no boot do app
        this.updateSidebarLayout();
    },

    async render() {
        try {
            const config = await db.getConfig();

            // Popula Empresa
            document.getElementById('cfg-name').value = config.name || '';
            document.getElementById('cfg-cnpj').value = config.cnpj || '';
            document.getElementById('cfg-phone').value = config.phone || '';
            document.getElementById('cfg-footer').value = config.footer_message || '';
            document.getElementById('cfg-address').value = config.address || '';
            document.getElementById('cfg-markup').value = config.markup || 50;

            this.currentLogoBase64 = config.logo_base64 || '';
            this.renderLogoPreview(this.currentLogoBase64);

            // Popula WhatsApp
            document.getElementById('cfg-wa-mode').value = config.wa_mode || 'link';
            document.getElementById('cfg-wa-endpoint').value = config.wa_endpoint || '';
            document.getElementById('cfg-wa-token').value = config.wa_token || '';

            this.toggleWaFields(config.wa_mode || 'link');

            // Renderiza a lista de usuários cadastrados
            await this.renderUsersList();
        } catch (e) {
            console.error('Erro ao renderizar configurações:', e);
        }
    },

    renderLogoPreview(base64) {
        const container = document.getElementById('cfg-logo-preview-container');
        const img = document.getElementById('cfg-logo-preview');
        if (!container || !img) return;

        if (base64) {
            img.src = base64;
            container.style.display = 'flex';
        } else {
            img.src = '';
            container.style.display = 'none';
        }
    },

    toggleWaFields(mode) {
        const fields = document.getElementById('cfg-wa-api-fields');
        if (fields) {
            fields.style.display = mode === 'api' ? 'block' : 'none';
        }
    },

    async saveCompanyConfig() {
        try {
            const config = await db.getConfig();
            
            config.name = document.getElementById('cfg-name').value;
            config.cnpj = document.getElementById('cfg-cnpj').value;
            config.phone = document.getElementById('cfg-phone').value;
            config.footer_message = document.getElementById('cfg-footer').value;
            config.address = document.getElementById('cfg-address').value;
            config.markup = parseInt(document.getElementById('cfg-markup').value) || 50;
            config.logo_base64 = this.currentLogoBase64;

            await db.saveConfig(config);
            await this.updateSidebarLayout();
            await app.showAlert('Configurações da empresa salvas com sucesso!');
        } catch (e) {
            await app.showAlert('Erro ao salvar configurações da empresa: ' + e.message);
        }
    },

    async saveWhatsappConfig() {
        try {
            const config = await db.getConfig();

            config.wa_mode = document.getElementById('cfg-wa-mode').value;
            config.wa_endpoint = document.getElementById('cfg-wa-endpoint').value;
            config.wa_token = document.getElementById('cfg-wa-token').value;

            if (config.wa_mode === 'api' && !config.wa_endpoint) {
                await app.showAlert('Por favor, informe a URL do Endpoint para o modo de API Dedicada.');
                return;
            }

            await db.saveConfig(config);
            await app.showAlert('Configurações de integração do WhatsApp atualizadas!');
        } catch (e) {
            await app.showAlert('Erro ao salvar integração: ' + e.message);
        }
    },

    async updateSidebarLayout() {
        try {
            const config = await db.getConfig().catch(() => ({}));
            const elSidebar = document.getElementById('sidebar-user-name');
            
            const loggedUser = sessionStorage.getItem('loggedUser');
            if (!loggedUser && elSidebar && config.name) {
                elSidebar.textContent = config.name;
            }
        } catch (e) {
            console.error(e);
        }
    },

    // --- CONTROLE DE USUÁRIOS ---
    async renderUsersList() {
        try {
            const users = await db.getUsers();
            const tbody = document.getElementById('cfg-users-table-body');
            if (!tbody) return;

            tbody.innerHTML = '';

            const loggedUser = JSON.parse(sessionStorage.getItem('loggedUser')) || {};

            users.forEach(u => {
                const tr = document.createElement('tr');
                
                // Não pode excluir o admin base nem a si mesmo
                const isProtected = u.id === 1 || u.username === 'admin' || u.id === loggedUser.id;
                
                const btnDeleteHtml = isProtected
                    ? `<button class="btn btn-secondary btn-icon" disabled style="opacity: 0.4;" title="Conta protegida ou em uso"><i class="fa-solid fa-lock"></i></button>`
                    : `<button class="btn btn-danger btn-icon" onclick="app.configuracoes.deleteUser('${u.id}')" title="Excluir Usuário"><i class="fa-solid fa-trash-can"></i></button>`;

                const roleBadgeClass = u.role === 'admin' ? 'badge-info' : 'badge-secondary';
                const roleText = u.role === 'admin' ? 'Admin' : 'Vendedor';

                tr.innerHTML = `
                    <td><strong>${u.name}</strong></td>
                    <td><code style="color: #38bdf8;">${u.username}</code></td>
                    <td><span class="badge ${roleBadgeClass}">${roleText}</span></td>
                    <td style="text-align: center;">${btnDeleteHtml}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            console.error('Erro ao listar usuários:', e);
        }
    },

    async saveUserConfig() {
        const id = document.getElementById('cfg-user-id').value;
        const name = document.getElementById('cfg-user-name').value.trim();
        const username = document.getElementById('cfg-user-username').value.trim().toLowerCase();
        const password = document.getElementById('cfg-user-password').value.trim();
        const role = document.getElementById('cfg-user-role').value;

        if (!name || !username || (!id && !password)) {
            await app.showAlert('Por favor, preencha todos os campos do usuário.');
            return;
        }

        try {
            const users = await db.getUsers();
            if (!id && users.some(u => u.username === username)) {
                await app.showAlert('Este login de usuário já está cadastrado. Escolha outro.');
                return;
            }

            const userData = { name, username, password, role };
            if (id) userData.id = Number(id);

            await db.saveUser(userData);
            await app.showAlert('Usuário salvo com sucesso!');
            
            document.getElementById('form-config-user').reset();
            document.getElementById('cfg-user-id').value = '';

            await this.renderUsersList();
        } catch (e) {
            await app.showAlert('Erro ao salvar usuário: ' + e.message);
        }
    },

    async deleteUser(id) {
        if (!await app.showConfirm('Deseja realmente remover esta conta de acesso?')) return;
        try {
            await db.deleteUser(id);
            await this.renderUsersList();
        } catch (e) {
            await app.showAlert('Erro ao deletar usuário: ' + e.message);
        }
    }
};
