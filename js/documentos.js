// js/documentos.js

import { db } from './database.js';
import { app } from './app.js';

export const documentos = {
    activeCondicionalDoc: null,

    init() {
        // Confirmar fechamento do condicional
        const btnCondConfirm = document.getElementById('btn-cond-confirm');
        if (btnCondConfirm) {
            btnCondConfirm.addEventListener('click', async () => {
                await this.processCondicionalClosure();
            });
        }
        
        const searchInput = document.getElementById('doc-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.render());
        }
    },

    async render(forceRefresh = true) {
        try {
            if (forceRefresh || !this.cachedDocs) {
                this.cachedDocs = await db.getDocuments();
            }
            const docs = this.cachedDocs;
            const tbody = document.getElementById('list-documents-body');
            const searchInput = document.getElementById('doc-search-input');
            const filterText = searchInput ? searchInput.value.toLowerCase().trim() : '';

            if (!tbody) return;
            tbody.innerHTML = '';

            const filteredDocs = docs.filter(doc => {
                if (!filterText) return true;
                const idMatch = doc.id && doc.id.toLowerCase().includes(filterText);
                const nameMatch = doc.client_name && doc.client_name.toLowerCase().includes(filterText);
                return idMatch || nameMatch;
            });

            if (filteredDocs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhum documento encontrado.</td></tr>';
                return;
            }

            filteredDocs.forEach(doc => {
                const tr = document.createElement('tr');
                
                // Formatadores de Tipo e Status
                const typeLabels = {
                    orcamento: { text: 'Orçamento', badge: 'badge-info' },
                    condicional: { text: 'Condicional', badge: 'badge-warning' },
                    pedido: { text: 'Pedido', badge: 'badge-success' },
                    venda: { text: 'Venda', badge: 'badge-success' }
                };
                const statusLabels = {
                    aberto: { text: 'Aberto', badge: 'badge-warning' },
                    finalizado: { text: 'Finalizado', badge: 'badge-success' },
                    cancelado: { text: 'Cancelado', badge: 'badge-danger' },
                    devolvido: { text: 'Devolvido', badge: 'badge-info' },
                    faturado: { text: 'Faturado', badge: 'badge-success' },
                    faturando: { text: 'Faturando', badge: 'badge-primary' }
                };

                const type = typeLabels[doc.type] || { text: doc.type, badge: 'badge-secondary' };
                const status = statusLabels[doc.status] || { text: doc.status, badge: 'badge-secondary' };
                const formattedDate = app.formatDate(doc.date);

                tr.innerHTML = `
                    <td><strong style="color: #60a5fa;">${doc.id}</strong></td>
                    <td>${formattedDate}</td>
                    <td><span class="badge ${type.badge}">${type.text}</span></td>
                    <td>${doc.client_name}</td>
                    <td>${app.formatCurrency(doc.total)}</td>
                    <td><span class="badge ${status.badge}">${status.text}</span></td>
                    <td>
                        <div class="flex-gap">
                            <button class="btn btn-secondary btn-icon" onclick="app.documentos.viewReceipt('${doc.id}')" title="Ver Comprovante">
                                <i class="fa-solid fa-receipt"></i>
                            </button>
                            <button class="btn btn-success btn-icon" onclick="app.documentos.sendWhatsAppDirect('${doc.id}')" title="Enviar por WhatsApp">
                                <i class="fa-brands fa-whatsapp"></i>
                            </button>
                            ${doc.type === 'orcamento' && doc.status === 'aberto' ? `
                                <button class="btn btn-success btn-icon" onclick="app.documentos.faturarOrcamento('${doc.id}')" title="Faturar (Converter em Venda)">
                                    <i class="fa-solid fa-cart-shopping"></i> Faturar
                                </button>
                                <button class="btn btn-danger btn-icon" onclick="app.documentos.cancelOrcamento('${doc.id}')" title="Cancelar Orçamento">
                                    <i class="fa-solid fa-ban"></i>
                                </button>
                            ` : ''}
                            ${doc.type === 'condicional' && doc.status === 'aberto' ? `
                                <button class="btn btn-primary btn-icon" onclick="app.documentos.openCondicionalClosureModal('${doc.id}')" title="Devolução / Fechamento">
                                    <i class="fa-solid fa-hand-holding-dollar"></i> Fechar
                                </button>
                            ` : ''}
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            console.error('Erro ao renderizar documentos:', e);
        }
    },

    async viewReceipt(id) {
        try {
            const docs = await db.getDocuments();
            const doc = docs.find(d => d.id === id);
            if (doc) {
                app.pdv.showReceipt(doc);
            }
        } catch (e) {
            console.error(e);
        }
    },

    async sendWhatsAppDirect(id) {
        try {
            const docs = await db.getDocuments();
            const doc = docs.find(d => d.id === id);
            if (doc) {
                app.sendReceiptWhatsApp(doc);
            }
        } catch (e) {
            console.error(e);
        }
    },

    async cancelOrcamento(id) {
        if (await app.showConfirm('Deseja realmente cancelar este orçamento?')) {
            try {
                const docs = await db.getDocuments();
                const doc = docs.find(d => d.id === id);
                if (doc) {
                    await db.updateDocumentStatus(doc.id, 'cancelado');
                    doc.status = 'cancelado'; // Update locally
                    await this.render();
                }
            } catch (e) {
                await app.showAlert('Erro ao cancelar orçamento: ' + e.message);
            }
        }
    },

    async faturarOrcamento(id) {
        try {
            const docs = await db.getDocuments();
            const doc = docs.find(d => d.id === id);
            if (doc) {
                // Prepara o PDV
                app.pdv.clearPDV();
                app.pdv.selectedClientId = doc.client_id || 'c1';
                
                // Hydrates cart with the budget items
                const products = await db.getProducts();
                doc.items.forEach(item => {
                    const prod = products.find(p => p.id === item.id);
                    if (prod) {
                        app.pdv.cart.push({ product: prod, qty: item.qty });
                    }
                });

                app.pdv.discount = doc.discount || 0;
                app.pdv.addition = doc.addition || 0;
                app.pdv.linkedOrcamentoId = doc.id; // Vincula ao PDV para fechar só no checkout
                
                // Vai para o PDV para conferência e pagamento
                app.switchView('pdv');
                app.pdv.openCheckout();
            }
        } catch (e) {
            await app.showAlert('Erro ao faturar orçamento: ' + e.message);
        }
    },

    // --- CONDICIONAL RETURN FLOW ---
    async openCondicionalClosureModal(id) {
        try {
            const docs = await db.getDocuments();
            const doc = docs.find(d => d.id === id);
            if (!doc) return;

            this.activeCondicionalDoc = doc;
            document.getElementById('cond-client-info').textContent = `Cliente: ${doc.client_name} (Doc: ${doc.id})`;

            const tbody = document.getElementById('cond-items-body');
            tbody.innerHTML = '';

            doc.items.forEach((item, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${item.name}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${app.formatCurrency(item.price)}</span></td>
                    <td>${item.qty} un</td>
                    <td>
                        <input type="number" min="0" max="${item.qty}" class="form-control cond-return-qty" 
                               data-idx="${idx}" value="0" style="width: 70px; padding:0.35rem;" 
                               oninput="app.documentos.recalculateCondicionalClosure()">
                    </td>
                    <td class="cond-billed-qty" id="cond-billed-${idx}">${item.qty} un</td>
                `;
                tbody.appendChild(tr);
            });

            this.recalculateCondicionalClosure();
            app.openModal('modal-condicional');
        } catch (e) {
            console.error(e);
        }
    },

    recalculateCondicionalClosure() {
        if (!this.activeCondicionalDoc) return;

        const inputs = document.querySelectorAll('.cond-return-qty');
        let faturarTotal = 0;

        inputs.forEach(input => {
            const idx = parseInt(input.getAttribute('data-idx'));
            const returnQty = Math.min(this.activeCondicionalDoc.items[idx].qty, parseInt(input.value) || 0);
            
            // Corrige se lojista digitar número maior
            input.value = returnQty;

            const billedQty = this.activeCondicionalDoc.items[idx].qty - returnQty;
            document.getElementById(`cond-billed-${idx}`).textContent = `${billedQty} un`;

            faturarTotal += billedQty * this.activeCondicionalDoc.items[idx].price;
        });

        const finalTotal = Math.max(0, faturarTotal - (this.activeCondicionalDoc.discount || 0) + (this.activeCondicionalDoc.addition || 0));
        document.getElementById('cond-faturar-total').textContent = app.formatCurrency(finalTotal);
    },

    async processCondicionalClosure() {
        if (!this.activeCondicionalDoc) return;

        const inputs = document.querySelectorAll('.cond-return-qty');
        let restockItems = [];
        let sellItems = [];
        let totalBilled = 0;

        inputs.forEach(input => {
            const idx = parseInt(input.getAttribute('data-idx'));
            const item = this.activeCondicionalDoc.items[idx];
            const returned = parseInt(input.value) || 0;
            const billed = item.qty - returned;

            if (returned > 0) {
                restockItems.push({ id: item.id, qty: returned });
            }
            if (billed > 0) {
                sellItems.push({ id: item.id, name: item.name, price: item.price, qty: billed });
                totalBilled += billed * item.price;
            }
        });

        try {
            // 1. Restabelece itens devolvidos de volta ao estoque
            for (const item of restockItems) {
                await db.adjustStock(item.id, item.qty);
            }

            const finalTotal = Math.max(0, totalBilled - (this.activeCondicionalDoc.discount || 0) + (this.activeCondicionalDoc.addition || 0));

            // Se o cliente devolveu tudo (totalBilled == 0)
            if (totalBilled === 0) {
                await db.updateDocument(this.activeCondicionalDoc.id, {
                    items: [],
                    total: 0,
                    status: 'devolvido'
                });
                
                app.closeModal('modal-condicional');
                await this.render();
                await app.showAlert('Produtos devolvidos com sucesso! Estoque recomposto.');
                return;
            }

            // Atualiza o documento condicional com os itens que ficaram e muda status
            await db.updateDocument(this.activeCondicionalDoc.id, {
                items: sellItems,
                total: finalTotal,
                status: 'faturando' // Status temporário até fechar a venda
            });

            app.closeModal('modal-condicional');

            // Joga os itens para o PDV para conferência e faturamento
            app.pdv.clearPDV();
            app.pdv.selectedClientId = this.activeCondicionalDoc.client_id || 'c1';
            
            const products = await db.getProducts();
            sellItems.forEach(item => {
                const prod = products.find(p => p.id === item.id);
                if (prod) {
                    app.pdv.cart.push({ product: prod, qty: item.qty });
                }
            });

            app.pdv.discount = this.activeCondicionalDoc.discount || 0;
            app.pdv.addition = this.activeCondicionalDoc.addition || 0;
            app.pdv.linkedOrcamentoId = this.activeCondicionalDoc.id;
            
            // Vai para o PDV para conferência
            app.switchView('pdv');

        } catch (e) {
            await app.showAlert('Erro ao processar fechamento: ' + e.message);
        }
    }
};
