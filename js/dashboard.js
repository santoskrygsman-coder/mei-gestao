// js/dashboard.js

import { db } from './database.js';
import { app } from './app.js';

export const dashboard = {
    chartType: 'cashflow',

    init() {
        const btnCashflow = document.getElementById('btn-chart-cashflow');
        const btnSales = document.getElementById('btn-chart-sales');

        if (btnCashflow && btnSales) {
            btnCashflow.addEventListener('click', () => {
                this.chartType = 'cashflow';
                this.renderCashflowChart();
            });

            btnSales.addEventListener('click', () => {
                this.chartType = 'sales';
                this.renderCashflowChart();
            });
        }
    },

    async render() {
        try {
            document.getElementById('dash-faturamento').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-muted" style="font-size: 0.9em;"></i>';
            document.getElementById('dash-estoque-total').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-muted" style="font-size: 0.9em;"></i>';
            document.getElementById('dash-estoque-critico').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-muted" style="font-size: 0.9em;"></i>';
            document.getElementById('dash-receber-vencido').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-muted" style="font-size: 0.9em;"></i>';
            
            document.getElementById('mei-termometro-percent').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-muted" style="font-size: 0.9em;"></i>';
            document.getElementById('mei-termometro-sales').innerHTML = 'Carregando...';

            const [transactions, products, accounts] = await Promise.all([
                db.getTransactions(),
                db.getProducts(),
                db.getAccounts()
            ]);
            
            this.cachedTransactions = transactions;
            this.cachedProducts = products;
            this.cachedAccounts = accounts;

            this.updateMetrics();
            this.renderRecentTransactions();
            this.renderLowStockList();
            this.renderCashflowChart();
            this.renderMeiTermometro();
        } catch (e) {
            console.error('Erro ao buscar dados da dashboard:', e);
        }
    },

    renderMeiTermometro() {
        const transactions = this.cachedTransactions;
        const currentYear = new Date().getFullYear();

        const totalVendasAno = transactions
            .filter(t => {
                if (t.type !== 'receita') return false;
                const tDateStr = String(t.date).split('T')[0];
                const tDate = new Date(tDateStr + 'T12:00:00');
                return tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        const limiteAnual = 81000.00;
        const realPercent = (totalVendasAno / limiteAnual) * 100;
        const barPercent = Math.min(100, realPercent);

        const statusLabel = document.getElementById('mei-termometro-percent');
        if (statusLabel) {
            statusLabel.textContent = `${realPercent.toFixed(1)}%`;
            if (realPercent > 120) {
                statusLabel.textContent += ' (Desenquadramento Retroativo)';
                statusLabel.style.color = 'var(--danger)';
            } else if (realPercent > 100) {
                statusLabel.textContent += ' (Excesso até 20%)';
                statusLabel.style.color = '#f97316'; // Laranja forte
            } else {
                statusLabel.style.color = 'var(--primary)';
            }
        }
        
        const salesLabel = document.getElementById('mei-termometro-sales');
        if (salesLabel) {
            salesLabel.textContent = `Acumulado em ${currentYear}: ${app.formatCurrency(totalVendasAno)}`;
        }
        
        const bar = document.getElementById('mei-termometro-bar');
        if (bar) {
            bar.style.width = `${barPercent}%`;
            if (realPercent > 120) {
                bar.style.background = 'linear-gradient(90deg, #dc2626, #7f1d1d)'; // Vermelho bem escuro
            } else if (realPercent > 100) {
                bar.style.background = 'var(--danger)'; // Passou de 100%
            } else if (realPercent > 80) {
                bar.style.background = 'var(--warning)'; // Alerta amarelo
            } else {
                bar.style.background = 'linear-gradient(90deg, var(--primary), var(--success))'; // Tudo OK
            }
        }
    },

    updateMetrics() {
        const products = this.cachedProducts;
        const transactions = this.cachedTransactions;
        const accounts = this.cachedAccounts;
        const todayStr = new Date().toISOString().split('T')[0];

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const faturamento = transactions
            .filter(t => {
                if (t.type !== 'receita') return false;
                const tDateStr = String(t.date).split('T')[0];
                const tDate = new Date(tDateStr + 'T12:00:00');
                return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        document.getElementById('dash-faturamento').textContent = app.formatCurrency(faturamento);

        const totalEstoque = products.reduce((sum, p) => sum + (p.stock || 0), 0);
        document.getElementById('dash-estoque-total').textContent = totalEstoque;

        const estoqueCritico = products.filter(p => (p.stock || 0) <= (p.minStock || 0)).length;
        const criticoEl = document.getElementById('dash-estoque-critico');
        criticoEl.textContent = estoqueCritico;
        if (estoqueCritico > 0) {
            criticoEl.className = 'value text-danger';
        } else {
            criticoEl.className = 'value text-success';
        }

        const receberVencido = accounts
            .filter(a => a.type === 'receber' && a.status === 'pendente' && (a.dueDate || a.due_date) < todayStr)
            .reduce((sum, a) => sum + a.amount, 0);

        document.getElementById('dash-receber-vencido').textContent = app.formatCurrency(receberVencido);
    },

    renderRecentTransactions() {
        const transactions = this.cachedTransactions.slice(0, 5);
        const tbody = document.getElementById('dash-recent-transactions');
        tbody.innerHTML = '';

        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-muted" style="text-align: center;">Nenhum lançamento registrado.</td></tr>';
            return;
        }

        transactions.forEach(t => {
            const tr = document.createElement('tr');
            const classValue = t.type === 'receita' ? 'text-success' : 'text-danger';
            const prefix = t.type === 'receita' ? '+' : '-';
            
            tr.innerHTML = `
                <td>${t.description || t.desc}</td>
                <td><span class="badge ${t.type === 'receita' ? 'badge-success' : 'badge-danger'}">${t.category}</span></td>
                <td class="${classValue} font-weight-600">${prefix} ${app.formatCurrency(t.amount)}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderLowStockList() {
        const products = this.cachedProducts;
        const listEl = document.getElementById('dash-low-stock-list');
        const alertCard = document.getElementById('dash-alert-stock-card');
        const alertBody = document.getElementById('dash-alert-stock-body');
        const alertCount = document.getElementById('dash-alert-stock-count');

        listEl.innerHTML = '';
        if (alertBody) alertBody.innerHTML = '';

        const lowStockProducts = products.filter(p => (p.stock || 0) <= (p.minStock || 0));

        // 1. Atualiza o painel superior de alertas críticos
        if (alertCard && alertBody) {
            if (lowStockProducts.length === 0) {
                alertCard.style.display = 'none';
            } else {
                alertCard.style.display = 'block';
                if (alertCount) {
                    alertCount.textContent = `${lowStockProducts.length} ${lowStockProducts.length === 1 ? 'produto' : 'produtos'}`;
                }

                lowStockProducts.forEach(p => {
                    const tr = document.createElement('tr');
                    const ratio = p.minStock > 0 ? (p.stock / p.minStock) : 0;
                    let badgeClass = 'badge-danger';
                    let statusText = 'Crítico';

                    if (p.stock === 0) {
                        statusText = 'Zerado';
                    } else if (ratio > 0.5) {
                        badgeClass = 'badge-warning';
                        statusText = 'Atenção';
                    } else {
                        statusText = 'Muito Baixo';
                    }

                    tr.innerHTML = `
                        <td><strong>${p.name}</strong></td>
                        <td class="font-weight-600 ${p.stock === 0 ? 'text-danger' : 'text-warning'}">${p.stock} un</td>
                        <td class="text-muted">${p.minStock} un</td>
                        <td><span class="badge ${badgeClass}">${statusText}</span></td>
                        <td style="text-align: center;">
                            <button class="btn btn-warning btn-sm" onclick="app.dashboard.quickRestock('${p.id}')" style="padding: 0.3rem 0.65rem; font-size: 0.75rem;">
                                <i class="fa-solid fa-arrow-rotate-left"></i> Repor
                            </button>
                        </td>
                    `;
                    alertBody.appendChild(tr);
                });
            }
        }

        // 2. Atualiza a lista rápida da barra lateral
        if (lowStockProducts.length === 0) {
            listEl.innerHTML = '<div class="text-success" style="font-size: 0.85rem; padding: 0.5rem;"><i class="fa-solid fa-circle-check"></i> Todos os itens abastecidos!</div>';
            return;
        }

        lowStockProducts.forEach(p => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.justify = 'space-between';
            item.style.alignItems = 'center';
            item.style.padding = '0.65rem 0.75rem';
            item.style.borderRadius = '8px';
            item.style.background = 'rgba(255, 255, 255, 0.02)';
            item.style.border = '1px solid rgba(255, 255, 255, 0.04)';
            item.style.fontSize = '0.85rem';
            item.style.cursor = 'pointer';
            item.style.transition = 'all 0.2s ease';

            // Efeito hover dinâmico
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(255, 255, 255, 0.06)';
                item.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                item.style.transform = 'translateX(2px)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'rgba(255, 255, 255, 0.02)';
                item.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                item.style.transform = 'none';
            });

            // Clique rápido para reposição
            item.addEventListener('click', () => this.quickRestock(p.id));

            const badgeHtml = p.stock === 0
                ? '<span class="badge badge-danger" style="font-size:0.7rem;">Sem Estoque</span>'
                : `<span class="badge badge-warning" style="font-size:0.7rem;">${p.stock} un</span>`;

            item.innerHTML = `
                <div style="flex-grow: 1; padding-right: 0.5rem;">
                    <strong style="color: var(--text-main); font-weight: 600;">${p.name}</strong>
                    <span class="text-muted" style="font-size: 0.72rem; display: block; margin-top: 0.1rem;">Estoque Mínimo: ${p.minStock} un</span>
                </div>
                ${badgeHtml}
            `;
            listEl.appendChild(item);
        });
    },

    quickRestock(productId) {
        app.switchView('estoque');
        
        const select = document.getElementById('ajuste-produto-id');
        if (select) {
            select.value = productId;
            select.dispatchEvent(new Event('change'));
        }

        app.openModal('modal-ajuste-estoque');
    },

    renderCashflowChart() {
        const transactions = this.cachedTransactions || [];
        const container = document.getElementById('cashflow-chart');
        if (!container) return;
        
        container.innerHTML = '';

        const btnCashflow = document.getElementById('btn-chart-cashflow');
        const btnSales = document.getElementById('btn-chart-sales');
        const titleEl = document.getElementById('dash-chart-title');

        const getLocalDateStr = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        if (this.chartType === 'cashflow') {
            if (btnCashflow) btnCashflow.style.borderColor = 'var(--primary)';
            if (btnSales) btnSales.style.borderColor = 'var(--panel-border)';
            if (titleEl) titleEl.innerHTML = 'Fluxo de Caixa <span style="font-size:0.8rem; margin-left: 10px; font-weight: normal;"><span style="color:var(--success);">■ Entradas</span> <span style="color:var(--danger); margin-left: 5px;">■ Saídas</span></span>';

            const days = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                days.push(getLocalDateStr(d));
            }

            const chartData = days.map(dateStr => {
                const daily = transactions.filter(t => {
                    const tDateStr = String(t.date).split('T')[0];
                    return tDateStr === dateStr;
                });
                const receita = daily.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
                const despesa = daily.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
                return {
                    date: dateStr,
                    label: dateStr.split('-').slice(1, 3).reverse().join('/'), 
                    receita,
                    despesa
                };
            });

            const maxVal = Math.max(...chartData.map(d => Math.max(d.receita, d.despesa)), 50);

            chartData.forEach(day => {
                const col = document.createElement('div');
                col.className = 'bar-column';
                col.style.width = '14%';
                col.style.position = 'relative';
                col.onmouseover = () => { const tip = col.querySelector('.custom-tooltip'); if(tip) tip.style.display = 'block'; };
                col.onmouseout = () => { const tip = col.querySelector('.custom-tooltip'); if(tip) tip.style.display = 'none'; };

                const recHeight = Math.max((day.receita / maxVal) * 110, day.receita > 0 ? 5 : 3);
                const despHeight = Math.max((day.despesa / maxVal) * 110, day.despesa > 0 ? 5 : 3);

                col.innerHTML = `
                    <div class="custom-tooltip" style="display:none; position:absolute; bottom: 120px; left: 50%; transform: translateX(-50%); background: var(--panel-bg); border: 1px solid var(--panel-border); padding: 8px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 10; white-space: nowrap; font-size: 0.8rem; pointer-events: none;">
                        <div style="color:var(--success); font-weight:bold; margin-bottom:3px;">Entradas: ${app.formatCurrency(day.receita)}</div>
                        <div style="color:var(--danger); font-weight:bold;">Saídas: ${app.formatCurrency(day.despesa)}</div>
                    </div>
                    <div style="display: flex; gap: 4px; width: 100%; height: 110px; justify-content: center; align-items: flex-end;">
                        <div class="bar-visual receita" style="height: ${recHeight}px; width: 10px;" title="Entradas: ${app.formatCurrency(day.receita)}"></div>
                        <div class="bar-visual despesa" style="height: ${despHeight}px; width: 10px;" title="Saídas: ${app.formatCurrency(day.despesa)}"></div>
                    </div>
                    <div class="bar-label" style="font-size:0.75rem; margin-top: 0.35rem; color: var(--text-muted);">${day.label}</div>
                `;
                container.appendChild(col);
            });
        } else {
            if (btnSales) btnSales.style.borderColor = 'var(--primary)';
            if (btnCashflow) btnCashflow.style.borderColor = 'var(--panel-border)';
            if (titleEl) titleEl.innerHTML = 'Comparativo Vendas <span style="font-size:0.8rem; margin-left: 10px; font-weight: normal;"><span style="color:var(--primary);">■ Esta Semana</span> <span style="color:#8b5cf6; margin-left: 5px;">■ Anterior</span></span>';

            const daysA = [];
            const daysB = [];
            for (let i = 6; i >= 0; i--) {
                const dA = new Date();
                dA.setDate(dA.getDate() - i);
                daysA.push(getLocalDateStr(dA));

                const dB = new Date();
                dB.setDate(dB.getDate() - (i + 7));
                daysB.push(getLocalDateStr(dB));
            }

            const chartData = daysA.map((dateStr, idx) => {
                const prevDateStr = daysB[idx];

                const salesA = transactions.filter(t => {
                    const tDateStr = String(t.date).split('T')[0];
                    return tDateStr === dateStr && t.type === 'receita' && (t.category === 'Vendas' || t.category === 'Fiado');
                });
                const salesB = transactions.filter(t => {
                    const tDateStr = String(t.date).split('T')[0];
                    return tDateStr === prevDateStr && t.type === 'receita' && (t.category === 'Vendas' || t.category === 'Fiado');
                });

                const totalA = salesA.reduce((sum, t) => sum + t.amount, 0);
                const totalB = salesB.reduce((sum, t) => sum + t.amount, 0);

                return {
                    label: dateStr.split('-').slice(1, 3).reverse().join('/'), 
                    totalA,
                    totalB
                };
            });

            const maxVal = Math.max(...chartData.map(d => Math.max(d.totalA, d.totalB)), 50);

            chartData.forEach(day => {
                const col = document.createElement('div');
                col.className = 'bar-column';
                col.style.width = '14%';
                col.style.position = 'relative';
                col.onmouseover = () => { const tip = col.querySelector('.custom-tooltip'); if(tip) tip.style.display = 'block'; };
                col.onmouseout = () => { const tip = col.querySelector('.custom-tooltip'); if(tip) tip.style.display = 'none'; };

                const heightA = Math.max((day.totalA / maxVal) * 110, day.totalA > 0 ? 5 : 3);
                const heightB = Math.max((day.totalB / maxVal) * 110, day.totalB > 0 ? 5 : 3);

                col.innerHTML = `
                    <div class="custom-tooltip" style="display:none; position:absolute; bottom: 120px; left: 50%; transform: translateX(-50%); background: var(--panel-bg); border: 1px solid var(--panel-border); padding: 8px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 10; white-space: nowrap; font-size: 0.8rem; pointer-events: none;">
                        <div style="color:var(--primary); font-weight:bold; margin-bottom:3px;">Esta Sem: ${app.formatCurrency(day.totalA)}</div>
                        <div style="color:#8b5cf6; font-weight:bold;">Anterior: ${app.formatCurrency(day.totalB)}</div>
                    </div>
                    <div style="display: flex; gap: 4px; width: 100%; height: 110px; justify-content: center; align-items: flex-end;">
                        <div class="bar-visual receita" style="height: ${heightA}px; width: 10px; background: linear-gradient(to top, rgba(14,165,233,0.2) 0%, var(--primary) 100%); box-shadow: 0 0 10px rgba(14,165,233,0.15);" title="Esta Semana: ${app.formatCurrency(day.totalA)}"></div>
                        <div class="bar-visual despesa" style="height: ${heightB}px; width: 10px; background: linear-gradient(to top, rgba(139,92,246,0.2) 0%, #8b5cf6 100%); box-shadow: 0 0 10px rgba(139,92,246,0.15);" title="Semana Anterior: ${app.formatCurrency(day.totalB)}"></div>
                    </div>
                    <div class="bar-label" style="font-size:0.75rem; margin-top: 0.35rem; color: var(--text-muted);">${day.label}</div>
                `;
                container.appendChild(col);
            });
        }
    }
};
