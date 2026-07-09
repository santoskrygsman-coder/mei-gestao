// js/relatorios.js

import { db } from './database.js';
import { app } from './app.js';

export const relatorios = {
    filterStart: '',
    filterEnd: '',

    init() {
        this.setDefaultDates();

        const form = document.getElementById('form-report-filter');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                this.filterStart = document.getElementById('report-filter-start').value;
                this.filterEnd = document.getElementById('report-filter-end');
                const filterEndVal = document.getElementById('report-filter-end').value;
                this.filterEnd = filterEndVal;
                
                await this.render();
            });
        }

        const btnExportDre = document.getElementById('btn-export-dre-csv');
        if (btnExportDre) {
            btnExportDre.addEventListener('click', () => this.exportDreToExcel());
        }

        const btnExportAbc = document.getElementById('btn-export-abc-csv');
        if (btnExportAbc) {
            btnExportAbc.addEventListener('click', () => this.exportAbcToExcel());
        }

        const btnExportDevedores = document.getElementById('btn-export-devedores-csv');
        if (btnExportDevedores) {
            btnExportDevedores.addEventListener('click', () => this.exportDevedoresToExcel());
        }

        const btnExportCaixa = document.getElementById('btn-export-csv');
        if (btnExportCaixa) {
            btnExportCaixa.addEventListener('click', () => this.exportCaixaToExcel());
        }
    },

    setDefaultDates() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const pad = (num) => String(num).padStart(2, '0');
        this.filterStart = `${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-${pad(firstDay.getDate())}`;
        this.filterEnd = `${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}`;
    },

    async render() {
        // Preenche os campos do form com os filtros ativos
        const inputStart = document.getElementById('report-filter-start');
        const inputEnd = document.getElementById('report-filter-end');

        if (inputStart) inputStart.value = this.filterStart;
        if (inputEnd) inputEnd.value = this.filterEnd;

        try {
            // Busca dados da API em paralelo
            const [documents, transactions, products, clients] = await Promise.all([
                db.getDocuments(),
                db.getTransactions(),
                db.getProducts(),
                db.getClients()
            ]);

            this.cachedDocuments = documents;
            this.cachedTransactions = transactions;
            this.cachedProducts = products;
            this.cachedClients = clients;

            this.renderDre();
            this.renderAbcReport();
            this.renderDevedoresReport();
        } catch (e) {
            console.error('Erro ao carregar dados dos relatórios:', e);
        }
    },

    renderDre() {
        const documents = this.cachedDocuments;
        const transactions = this.cachedTransactions;
        const products = this.cachedProducts;

        // 1. Receita Bruta (Filtrada por data)
        const receitaBruta = transactions
            .filter(t => {
                if (t.type !== 'receita') return false;
                return t.date >= this.filterStart && t.date <= this.filterEnd;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        // 2. Custo de Mercadorias Vendidas (CMV - Filtrado por data)
        let cmv = 0;
        documents
            .filter(d => {
                if (d.type !== 'venda' && d.type !== 'pedido') return false;
                if (d.status !== 'finalizado') return false;
                return d.date >= this.filterStart && d.date <= this.filterEnd;
            })
            .forEach(d => {
                d.items.forEach(item => {
                    const prod = products.find(p => p.id === item.id);
                    cmv += item.qty * (prod ? (prod.cost || 0) : 0);
                });
            });

        // 3. Lucro Bruto Comercial
        const lucroBruto = receitaBruta - cmv;

        // 4. Despesas Operacionais / Custos Fixos (Tudo que não for despesa com estoque)
        const despesasOperacionais = transactions
            .filter(t => {
                if (t.type !== 'despesa') return false;
                if (t.category === 'Estoque/Mercadoria') return false;
                return t.date >= this.filterStart && t.date <= this.filterEnd;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        // 5. Resultado Líquido
        const lucroLiquido = lucroBruto - despesasOperacionais;

        // Atualiza a tabela DRE no HTML
        const tableBody = document.getElementById('report-dre-body');
        if (!tableBody) return;

        tableBody.innerHTML = `
            <tr>
                <td>(+) Receita Bruta de Vendas</td>
                <td style="text-align: right;" class="text-success font-weight-600">${app.formatCurrency(receitaBruta)}</td>
            </tr>
            <tr>
                <td>(-) Custo de Mercadorias Vendidas (CMV)</td>
                <td style="text-align: right;" class="text-danger">${app.formatCurrency(cmv)}</td>
            </tr>
            <tr style="background: rgba(255, 255, 255, 0.02); font-weight: 600;">
                <td>(=) Lucro Bruto Comercial</td>
                <td style="text-align: right;" class="text-success">${app.formatCurrency(lucroBruto)}</td>
            </tr>
            <tr>
                <td>(-) Despesas Fixas / Operacionais</td>
                <td style="text-align: right;" class="text-danger">${app.formatCurrency(despesasOperacionais)}</td>
            </tr>
            <tr style="background: rgba(59, 130, 246, 0.1); border-top: 2px solid var(--primary); font-size: 1.1rem;">
                <td style="font-weight: 700;">(=) Lucro Líquido do Período</td>
                <td style="text-align: right;" class="${lucroLiquido >= 0 ? 'text-success' : 'text-danger'} font-weight-700">${app.formatCurrency(lucroLiquido)}</td>
            </tr>
            <tr>
                <td colspan="2" class="text-muted" style="font-size:0.75rem; text-align: center; font-style: italic;">
                    ${lucroLiquido >= 0 ? 'Superávit / Lucro' : 'Déficit / Prejuízo'} (Margem Líquida: ${receitaBruta > 0 ? ((lucroLiquido / receitaBruta) * 100).toFixed(1) : 0}%)
                </td>
            </tr>
        `;
    },

    renderAbcReport() {
        const documents = this.cachedDocuments;
        const products = this.cachedProducts;

        const salesStats = {};

        products.forEach(p => {
            salesStats[p.id] = {
                name: p.name,
                qtySold: 0,
                revenue: 0,
                cost: p.cost || 0,
                price: p.price || 0
            };
        });

        documents
            .filter(d => (d.type === 'venda' || d.type === 'pedido') && d.status === 'finalizado')
            .filter(d => d.date >= this.filterStart && d.date <= this.filterEnd)
            .forEach(d => {
                d.items.forEach(item => {
                    if (salesStats[item.id]) {
                        salesStats[item.id].qtySold += item.qty;
                        salesStats[item.id].revenue += item.qty * item.price;
                    } else {
                        salesStats[item.id] = {
                            name: `${item.name} (Excluído)`,
                            qtySold: item.qty,
                            revenue: item.qty * item.price,
                            cost: 0,
                            price: item.price
                        };
                    }
                });
            });

        const sortedList = Object.values(salesStats)
            .filter(item => item.qtySold > 0)
            .sort((a, b) => b.revenue - a.revenue);

        const tbody = document.getElementById('report-abc-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (sortedList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-muted" style="text-align: center;">Nenhuma venda registrada para apuração neste período.</td></tr>';
            return;
        }

        sortedList.forEach(item => {
            const totalCusto = item.qtySold * item.cost;
            const lucroBruto = item.revenue - totalCusto;
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td><strong>${item.name}</strong></td>
                <td>${item.qtySold} un</td>
                <td style="text-align: right;" class="text-success font-weight-600">${app.formatCurrency(item.revenue)}</td>
                <td style="text-align: right;" class="text-muted">${app.formatCurrency(totalCusto)}</td>
                <td style="text-align: right;" class="text-success font-weight-600">${app.formatCurrency(lucroBruto)}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderDevedoresReport() {
        const clients = this.cachedClients;
        const devedores = clients.filter(c => c.balance < 0);

        const tbody = document.getElementById('report-devedores-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (devedores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-success" style="text-align: center; font-weight: 500;"><i class="fa-solid fa-circle-check"></i> Sem inadimplência ativa! Todos os clientes em dia.</td></tr>';
            return;
        }

        devedores.forEach(c => {
            const tr = document.createElement('tr');
            const valorDevido = Math.abs(c.balance);

            tr.innerHTML = `
                <td>
                    <strong>${c.name}</strong><br>
                    <span class="text-muted" style="font-size:0.75rem;">F: ${c.phone || 'Sem telefone'}</span>
                </td>
                <td style="text-align: right;" class="text-danger font-weight-600">${app.formatCurrency(valorDevido)}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="app.relatorios.whatsappCobrar('${c.id}')" title="Cobrar via WhatsApp">
                        <i class="fa-brands fa-whatsapp"></i> Cobrar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    whatsappCobrar(clientId) {
        const clients = this.cachedClients;
        const c = clients.find(item => item.id === clientId);
        if (!c || c.balance >= 0) return;

        const phone = (c.phone || '').replace(/\D/g, '');
        const valorFormatado = app.formatCurrency(Math.abs(c.balance));

        let text = `Olá, *${c.name}*! Tudo bem?\n\n`;
        text += `Passando para lembrar que consta em nosso sistema um débito em aberto no crediário no valor de *${valorFormatado}*.\n\n`;
        text += `Caso precise atualizar a data ou combinar a forma de pagamento (Dinheiro, Pix ou Cartão), estamos à disposição.\n\n`;
        text += `Agradecemos a parceria!`;

        const waUrl = `https://api.whatsapp.com/send?phone=${phone ? '55' + phone : ''}&text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
    },

    downloadCSV(filename, csvContent) {
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    exportCaixaToExcel() {
        const transactions = this.cachedTransactions;
        const filtered = transactions.filter(t => t.date >= this.filterStart && t.date <= this.filterEnd);
        
        let csv = 'ID;Data;Tipo;Categoria;Descricao;Valor\n';
        filtered.forEach(t => {
            const dataFmt = app.formatDate(t.date);
            const tipo = t.type === 'receita' ? 'Entrada' : 'Saida';
            const cat = t.category || '';
            const desc = (t.description || '').replace(/;/g, ',');
            const val = t.amount.toFixed(2).replace('.', ',');
            csv += `${t.id};${dataFmt};${tipo};${cat};${desc};${val}\n`;
        });
        
        this.downloadCSV('fluxo_caixa_exportacao.csv', csv);
    },

    exportDreToExcel() {
        const documents = this.cachedDocuments;
        const transactions = this.cachedTransactions;
        const products = this.cachedProducts;

        const receitaBruta = transactions
            .filter(t => t.type === 'receita' && t.date >= this.filterStart && t.date <= this.filterEnd)
            .reduce((sum, t) => sum + t.amount, 0);

        let cmv = 0;
        documents
            .filter(d => (d.type === 'venda' || d.type === 'pedido') && d.status === 'finalizado' && d.date >= this.filterStart && d.date <= this.filterEnd)
            .forEach(d => {
                d.items.forEach(item => {
                    const prod = products.find(p => p.id === item.id);
                    cmv += item.qty * (prod ? (prod.cost || 0) : 0);
                });
            });

        const despesasOperacionais = transactions
            .filter(t => t.type === 'despesa' && t.category !== 'Estoque/Mercadoria' && t.date >= this.filterStart && t.date <= this.filterEnd)
            .reduce((sum, t) => sum + t.amount, 0);

        const lucroBruto = receitaBruta - cmv;
        const lucroLiquido = lucroBruto - despesasOperacionais;

        let csv = 'Demonstrativo do Resultado do Exercício (DRE);;\r\n';
        csv += `Período: ${new Date(this.filterStart + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(this.filterEnd + 'T12:00:00').toLocaleDateString('pt-BR')};;\r\n\r\n`;
        csv += 'Indicador Financeiro;Valor;Descrição\r\n';
        csv += `(+) Receita Bruta de Vendas;R$ ${receitaBruta.toFixed(2).replace('.', ',')};Faturamento obtido no período\r\n`;
        csv += `(-) Custo de Mercadorias Vendidas (CMV);R$ ${cmv.toFixed(2).replace('.', ',')};Custo de aquisição do estoque vendido\r\n`;
        csv += `(=) Lucro Bruto Comercial;R$ ${lucroBruto.toFixed(2).replace('.', ',')};Resultado das vendas menos custo\r\n`;
        csv += `(-) Despesas Operacionais / Fixas;R$ ${despesasOperacionais.toFixed(2).replace('.', ',')};Custos fixos e despesas administrativas\r\n`;
        csv += `(=) Lucro Líquido do Período;R$ ${lucroLiquido.toFixed(2).replace('.', ',')};Resultado financeiro final consolidado\r\n`;

        this.downloadCSV(`DRE_${this.filterStart}_a_${this.filterEnd}.csv`, csv);
    },

    exportAbcToExcel() {
        const documents = this.cachedDocuments;
        const products = this.cachedProducts;

        const salesStats = {};
        products.forEach(p => {
            salesStats[p.id] = { name: p.name, qtySold: 0, revenue: 0, cost: p.cost || 0 };
        });

        documents
            .filter(d => (d.type === 'venda' || d.type === 'pedido') && d.status === 'finalizado' && d.date >= this.filterStart && d.date <= this.filterEnd)
            .forEach(d => {
                d.items.forEach(item => {
                    if (salesStats[item.id]) {
                        salesStats[item.id].qtySold += item.qty;
                        salesStats[item.id].revenue += item.qty * item.price;
                    }
                });
            });

        const list = Object.values(salesStats)
            .filter(item => item.qtySold > 0)
            .sort((a, b) => b.revenue - a.revenue);

        let csv = 'Ranking de Vendas - Curva ABC (Giro de Produtos);;;;\r\n';
        csv += `Período: ${new Date(this.filterStart + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(this.filterEnd + 'T12:00:00').toLocaleDateString('pt-BR')};;;;\r\n\r\n`;
        csv += 'Produto;Qtd. Vendida;Receita Total;Custo Total (CMV);Lucro Bruto\r\n';

        list.forEach(item => {
            const totalCusto = item.qtySold * item.cost;
            const lucroBruto = item.revenue - totalCusto;
            csv += `${item.name};${item.qtySold};R$ ${item.revenue.toFixed(2).replace('.', ',')};R$ ${totalCusto.toFixed(2).replace('.', ',')};R$ ${lucroBruto.toFixed(2).replace('.', ',')}\r\n`;
        });

        this.downloadCSV(`Curva_ABC_${this.filterStart}_a_${this.filterEnd}.csv`, csv);
    },

    exportDevedoresToExcel() {
        const clients = this.cachedClients;
        const devedores = clients.filter(c => c.balance < 0);

        let csv = 'Relatório de Inadimplência - Crediário Ativo;;\r\n';
        csv += `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')};;\r\n\r\n`;
        csv += 'Cliente;Telefone;Saldo Devedor\r\n';

        devedores.forEach(c => {
            const valorDevido = Math.abs(c.balance);
            csv += `${c.name};${c.phone || 'Sem fone'};R$ ${valorDevido.toFixed(2).replace('.', ',')}\r\n`;
        });

        this.downloadCSV(`Crediario_Ativo_${new Date().toISOString().split('T')[0]}.csv`, csv);
    }
};
