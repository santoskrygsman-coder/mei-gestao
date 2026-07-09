// js/clientes.js

import { db } from './database.js';
import { app } from './app.js';

export const clientes = {
    init() {
        const form = document.getElementById('form-client');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.save();
            });
        }

        const btnNew = document.getElementById('btn-new-client');
        if (btnNew) {
            btnNew.addEventListener('click', () => this.openCreateModal());
        }

        // Listener para quitação de débito
        const formPayment = document.getElementById('form-client-payment');
        if (formPayment) {
            formPayment.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveClientPayment();
            });
        }
    },

    async render() {
        try {
            const clients = await db.getClients();
            const tbody = document.getElementById('list-clients-body');
            tbody.innerHTML = '';

            if (clients.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align: center;">Nenhum cliente cadastrado.</td></tr>';
                return;
            }

            clients.forEach(c => {
                const tr = document.createElement('tr');
                
                // Estilo do saldo devedor
                let balanceText = app.formatCurrency(0);
                let balanceClass = 'text-muted';
                if (c.balance < 0) {
                    balanceText = app.formatCurrency(Math.abs(c.balance)) + ' (Devedor)';
                    balanceClass = 'text-danger font-weight-600';
                } else if (c.balance > 0) {
                    balanceText = app.formatCurrency(c.balance) + ' (Crédito)';
                    balanceClass = 'text-success font-weight-600';
                }

                // Botão receber fiado se devedor
                const isDebtor = c.balance < 0;
                const btnPayHtml = isDebtor
                    ? `<button class="btn btn-success" onclick="app.clientes.openPaymentModal('${c.id}')" title="Quitar Fiado" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;"><i class="fa-solid fa-hand-holding-dollar"></i> Receber</button>`
                    : '';

                tr.innerHTML = `
                    <td>${c.name}</td>
                    <td>${c.doc || '---'}</td>
                    <td>${c.phone || '---'}</td>
                    <td>${c.email || '---'}</td>
                    <td class="${balanceClass}">${balanceText}</td>
                    <td>
                        <div class="flex-gap">
                            ${btnPayHtml}
                            <button class="btn btn-secondary btn-icon" onclick="app.clientes.openEditModal('${c.id}')" title="Editar">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            ${c.id !== 'c1' ? `
                            <button class="btn btn-danger btn-icon" onclick="app.clientes.delete('${c.id}')" title="Excluir">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                            ` : ''}
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            console.error('Erro ao carregar lista de clientes:', e);
        }
    },

    openCreateModal() {
        document.getElementById('form-client').reset();
        document.getElementById('cli-id').value = '';
        document.getElementById('modal-client-title').textContent = 'Cadastrar Cliente';
        app.openModal('modal-client');
    },

    async openEditModal(id) {
        try {
            const clients = await db.getClients();
            const client = clients.find(c => c.id === id);
            if (client) {
                document.getElementById('cli-id').value = client.id;
                document.getElementById('cli-name').value = client.name;
                document.getElementById('cli-doc').value = client.doc || '';
                document.getElementById('cli-phone').value = client.phone || '';
                document.getElementById('cli-email').value = client.email || '';
                document.getElementById('modal-client-title').textContent = 'Editar Cliente';
                app.openModal('modal-client');
            }
        } catch (e) {
            console.error(e);
        }
    },

    async save() {
        const id = document.getElementById('cli-id').value;
        const name = document.getElementById('cli-name').value;
        const doc = document.getElementById('cli-doc').value;
        const phone = document.getElementById('cli-phone').value;
        const email = document.getElementById('cli-email').value;

        const clientData = { name, doc, phone, email };
        if (id) {
            clientData.id = id;
        }

        try {
            await db.saveClient(clientData);
            app.closeModal('modal-client');
            await this.render();
        } catch (e) {
            await app.showAlert('Erro ao salvar cliente: ' + e.message);
        }
    },

    async delete(id) {
        if (id === 'c1') {
            await app.showAlert('Não é possível excluir o Consumidor Geral.');
            return;
        }
        if (await app.showConfirm('Deseja realmente excluir este cliente?')) {
            try {
                await db.deleteClient(id);
                await this.render();
            } catch (e) {
                await app.showAlert('Erro ao excluir cliente: ' + e.message);
            }
        }
    },

    // --- RECEBIMENTO DE FIADO ---
    async openPaymentModal(clientId) {
        try {
            const clients = await db.getClients();
            const client = clients.find(c => c.id === clientId);
            if (!client) return;

            document.getElementById('pay-client-id').value = clientId;
            document.getElementById('pay-client-balance').textContent = app.formatCurrency(Math.abs(client.balance));
            document.getElementById('pay-amount').value = Math.abs(client.balance).toFixed(2);
            document.getElementById('pay-method').value = 'Dinheiro';

            app.openModal('modal-client-payment');
        } catch (e) {
            console.error(e);
        }
    },

    async saveClientPayment() {
        const clientId = document.getElementById('pay-client-id').value;
        const amountPaid = parseFloat(document.getElementById('pay-amount').value) || 0;
        const method = document.getElementById('pay-method').value;

        if (amountPaid <= 0) {
            await app.showAlert('Por favor, digite um valor de pagamento válido.');
            return;
        }

        try {
            await db.saveClientPayment(clientId, amountPaid, method);
            await app.showAlert(`Recebimento de ${app.formatCurrency(amountPaid)} registrado com sucesso!`);
            app.closeModal('modal-client-payment');
            
            // Recarrega visualizações
            await this.render();
            if (app.currentView === 'dashboard') await app.dashboard.render();
            if (app.currentView === 'financeiro') await app.financeiro.render();
            if (app.currentView === 'relatorios') await app.relatorios.render();
        } catch (e) {
            await app.showAlert('Erro ao registrar quitação: ' + e.message);
        }
    }
};
