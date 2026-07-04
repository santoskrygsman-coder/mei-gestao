// js/financeiro.js

import { db } from './database.js';
import { app } from './app.js';

export const financeiro = {
    init() {
        const form = document.getElementById('form-financeiro');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveEntry();
            });
        }

        const btnNewTrans = document.getElementById('btn-new-transaction');
        if (btnNewTrans) {
            btnNewTrans.addEventListener('click', () => this.openManualEntryModal('trans'));
        }

        const btnNewPayable = document.getElementById('btn-new-payable');
        if (btnNewPayable) {
            btnNewPayable.addEventListener('click', () => this.openManualEntryModal('payable'));
        }

        const btnNewReceivable = document.getElementById('btn-new-receivable');
        if (btnNewReceivable) {
            btnNewReceivable.addEventListener('click', () => this.openManualEntryModal('receivable'));
        }

        const selectType = document.getElementById('fin-type');
        if (selectType) {
            selectType.addEventListener('change', (e) => {
                this.adjustFormFields(e.target.value);
            });
        }
    },

    async render() {
        await this.renderTransactions();
        await this.renderPayable();
        await this.renderReceivable();
    },

    async renderTransactions() {
        try {
            const transactions = await db.getTransactions();
            const tbody = document.getElementById('list-transactions-body');
            tbody.innerHTML = '';

            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align: center;">Nenhum lançamento no caixa.</td></tr>';
                return;
            }

            transactions.forEach(t => {
                const tr = document.createElement('tr');
                const classValue = t.type === 'receita' ? 'text-success font-weight-600' : 'text-danger font-weight-600';
                const prefix = t.type === 'receita' ? '+' : '-';
                const formattedDate = new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR');

                tr.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${t.description || t.desc}</td>
                    <td><span class="badge ${t.type === 'receita' ? 'badge-success' : 'badge-danger'}">${t.type === 'receita' ? 'Entrada' : 'Saída'}</span></td>
                    <td><span class="badge badge-info">${t.category || 'Outros'}</span></td>
                    <td class="${classValue}">${prefix} ${app.formatCurrency(t.amount)}</td>
                    <td>
                        <button class="btn btn-danger btn-icon" onclick="app.financeiro.deleteTransaction('${t.id}')" title="Excluir">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            console.error('Erro ao renderizar transações:', e);
        }
    },

    async renderPayable() {
        try {
            const accounts = (await db.getAccounts()).filter(a => a.type === 'pagar');
            const tbody = document.getElementById('list-payable-body');
            tbody.innerHTML = '';

            if (accounts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-muted" style="text-align: center;">Nenhuma conta a pagar.</td></tr>';
                return;
            }

            accounts.forEach(a => {
                const tr = document.createElement('tr');
                const statusClass = a.status === 'pago' ? 'badge-success' : 'badge-warning';
                const statusText = a.status === 'pago' ? 'Pago' : 'Pendente';
                const formattedDate = new Date((a.dueDate || a.due_date) + 'T12:00:00').toLocaleDateString('pt-BR');

                tr.innerHTML = `
                    <td>${a.description || a.desc}</td>
                    <td>${formattedDate}</td>
                    <td class="font-weight-600">${app.formatCurrency(a.amount)}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="flex-gap">
                            ${a.status === 'pendente' ? `
                                <button class="btn btn-success btn-sm" onclick="app.financeiro.payAccount('${a.id}')">
                                    <i class="fa-solid fa-check"></i> Pagar
                                </button>
                            ` : ''}
                            <button class="btn btn-danger btn-icon" onclick="app.financeiro.deleteAccount('${a.id}')" title="Excluir">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            console.error('Erro ao renderizar contas a pagar:', e);
        }
    },

    async renderReceivable() {
        try {
            const accounts = (await db.getAccounts()).filter(a => a.type === 'receber');
            const tbody = document.getElementById('list-receivable-body');
            tbody.innerHTML = '';

            if (accounts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-muted" style="text-align: center;">Nenhuma conta a receber.</td></tr>';
                return;
            }

            accounts.forEach(a => {
                const tr = document.createElement('tr');
                const statusClass = a.status === 'pago' ? 'badge-success' : 'badge-warning';
                const statusText = a.status === 'pago' ? 'Recebido' : 'Pendente';
                const formattedDate = new Date((a.dueDate || a.due_date) + 'T12:00:00').toLocaleDateString('pt-BR');

                tr.innerHTML = `
                    <td>${a.description || a.desc}</td>
                    <td>${formattedDate}</td>
                    <td class="font-weight-600 text-success">${app.formatCurrency(a.amount)}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="flex-gap">
                            ${a.status === 'pendente' ? `
                                <button class="btn btn-success btn-sm" onclick="app.financeiro.payAccount('${a.id}')">
                                    <i class="fa-solid fa-check"></i> Receber
                                </button>
                            ` : ''}
                            <button class="btn btn-danger btn-icon" onclick="app.financeiro.deleteAccount('${a.id}')" title="Excluir">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            console.error('Erro ao renderizar contas a receber:', e);
        }
    },

    async openManualEntryModal(context) {
        document.getElementById('form-financeiro').reset();
        document.getElementById('fin-id').value = '';
        document.getElementById('fin-type-context').value = context;

        const selectType = document.getElementById('fin-type');
        selectType.disabled = false;

        document.getElementById('fin-date').value = new Date().toISOString().split('T')[0];

        await this.populateClientsSelect();

        if (context === 'trans') {
            selectType.value = 'receita';
            this.adjustFormFields('receita');
            document.getElementById('modal-financeiro-title').textContent = 'Novo Lançamento no Caixa';
        } else if (context === 'payable') {
            selectType.value = 'pagar';
            this.adjustFormFields('pagar');
            document.getElementById('modal-financeiro-title').textContent = 'Nova Conta a Pagar';
        } else if (context === 'receivable') {
            selectType.value = 'receber';
            this.adjustFormFields('receber');
            document.getElementById('modal-financeiro-title').textContent = 'Nova Conta a Receber (Crediário)';
        }

        app.openModal('modal-financeiro');
    },

    adjustFormFields(type) {
        const clientGroup = document.getElementById('fin-client-group');
        const dateLabel = document.getElementById('fin-date-label');

        if (type === 'pagar' || type === 'receber') {
            dateLabel.textContent = 'Data de Vencimento';
            clientGroup.style.display = type === 'receber' ? 'block' : 'none';
        } else {
            dateLabel.textContent = 'Data do Lançamento';
            clientGroup.style.display = 'none';
        }
    },

    async populateClientsSelect() {
        try {
            const clients = await db.getClients();
            const select = document.getElementById('fin-client-select');
            select.innerHTML = '<option value="">-- Selecione o Cliente (Opcional) --</option>';

            clients.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                select.appendChild(opt);
            });
        } catch (e) {
            console.error(e);
        }
    },

    async saveEntry() {
        const type = document.getElementById('fin-type').value;
        const desc = document.getElementById('fin-desc').value;
        const amount = parseFloat(document.getElementById('fin-amount').value);
        const date = document.getElementById('fin-date').value;
        const clientId = document.getElementById('fin-client-select').value;

        try {
            if (type === 'receita' || type === 'despesa') {
                await db.addTransaction({
                    type,
                    description: desc,
                    amount,
                    date,
                    category: type === 'receita' ? 'Manuais' : 'Custos Fixos'
                });
            } else {
                let clientName = '';
                if (type === 'receber' && clientId) {
                    const clients = await db.getClients();
                    const cliObj = clients.find(c => c.id === clientId);
                    if (cliObj) clientName = cliObj.name;
                }

                const account = {
                    type,
                    description: type === 'receber' && clientName ? `Crediário: ${clientName} - ${desc}` : desc,
                    amount,
                    dueDate: date,
                    client_id: type === 'receber' ? clientId : '',
                    status: 'pendente'
                };
                await db.saveAccount(account);

                if (type === 'receber' && clientId) {
                    await db.updateClientBalance(clientId, -amount);
                }
            }

            app.closeModal('modal-financeiro');
            await this.render();
            if (app.currentView === 'dashboard') await app.dashboard.render();
        } catch (e) {
            alert('Erro ao registrar lançamento: ' + e.message);
        }
    },

    async payAccount(id) {
        if (confirm('Deseja confirmar a liquidação financeira deste título?')) {
            try {
                await db.payAccount(id);
                alert('Título liquidado com sucesso!');
                await this.render();
                if (app.currentView === 'dashboard') await app.dashboard.render();
            } catch (e) {
                alert('Erro ao pagar conta: ' + e.message);
            }
        }
    },

    async deleteTransaction(id) {
        if (confirm('Excluir este lançamento do caixa? (Isso não altera saldos do estoque ou contas)')) {
            try {
                await db.request('DELETE', `/api/transactions/${id}`);
                await this.render();
                if (app.currentView === 'dashboard') await app.dashboard.render();
            } catch (e) {
                alert('Erro ao excluir transação: ' + e.message);
            }
        }
    },

    async deleteAccount(id) {
        if (confirm('Excluir este título? (Atenção: se for um crediário ativo, o saldo devedor do cliente não será reajustado automaticamente)')) {
            try {
                await db.request('DELETE', `/api/accounts/${id}`);
                await this.render();
                if (app.currentView === 'dashboard') await app.dashboard.render();
            } catch (e) {
                alert('Erro ao excluir título: ' + e.message);
            }
        }
    }
};
