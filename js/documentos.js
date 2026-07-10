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

    async render() {
        try {
            const docs = await db.getDocuments();
            const tbody = document.getElementById('list-documents-body');
            const searchInput = document.getElementById('doc-search-input');
            const filterText = searchInput ? searchInput.value.toLowerCase() : '';

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
                    faturado: { text: 'Faturado', badge: 'badge-success' }
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
                    doc.status = 'cancelado';
                    await db.saveDocument(doc);
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
                // Marca orçamento como faturado
                await db.updateDocumentStatus(doc.id, 'faturado');
                doc.status = 'faturado'; // Update locally just in case

                // Carrega itens no PDV
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
                
                // Vai para o PDV e já abre a tela de pagamento
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
                this.activeCondicionalDoc.status = 'devolvido';
                this.activeCondicionalDoc.total = 0;
                await db.saveDocument(this.activeCondicionalDoc);
                
                app.closeModal('modal-condicional');
                await this.render();
                await app.showAlert('Produtos devolvidos com sucesso! Estoque recomposto.');
                return;
            }

            // Se houver itens vendidos, abre um checkout especial para faturar
            app.closeModal('modal-condicional');

            // Configura checkout especial no namespace
            this.checkoutClosureData = {
                docId: this.activeCondicionalDoc.id,
                client_id: this.activeCondicionalDoc.client_id,
                items: sellItems,
                discount: this.activeCondicionalDoc.discount || 0,
                addition: this.activeCondicionalDoc.addition || 0,
                total: finalTotal
            };

            // Abre modal de checkout
            document.getElementById('checkout-total-display').textContent = app.formatCurrency(finalTotal);
            document.getElementById('checkout-cash-received').value = finalTotal.toFixed(2);
            
            // Define vencimento do crediário padrão
            const in30Days = new Date();
            in30Days.setDate(in30Days.getDate() + 30);
            document.getElementById('checkout-due-date').value = in30Days.toISOString().split('T')[0];

            // Vincula evento temporário de confirmação no botão de checkout
            const btnConfirmCheckout = document.getElementById('btn-confirm-checkout');
            
            // Remove listeners antigos clonando o nó
            const newBtn = btnConfirmCheckout.cloneNode(true);
            btnConfirmCheckout.parentNode.replaceChild(newBtn, btnConfirmCheckout);
            
            newBtn.addEventListener('click', async () => {
                await this.finishCondicionalSale();
            });
            
            app.openModal('modal-checkout');
        } catch (e) {
            await app.showAlert('Erro ao fechar condicional: ' + e.message);
        }
    },

    async finishCondicionalSale() {
        const payMethod = document.getElementById('checkout-payment-method').value;
        const data = this.checkoutClosureData;
        
        if (!data) return;

        try {
            // Atualiza documento condicional original
            const docs = await db.getDocuments();
            const originalDoc = docs.find(d => d.id === data.docId);
            if (originalDoc) {
                originalDoc.status = 'finalizado';
                originalDoc.total = data.total;
                originalDoc.paymentMethod = payMethod;
                
                // Grava histórico de devolução nos itens
                const inputs = document.querySelectorAll('.cond-return-qty');
                inputs.forEach(input => {
                    const idx = parseInt(input.getAttribute('data-idx'));
                    originalDoc.items[idx].returnedQty = parseInt(input.value) || 0;
                });

                await db.saveDocument(originalDoc);
            }

            // Registra financeiro
            if (payMethod === 'Crediário') {
                const dueDate = document.getElementById('checkout-due-date').value;
                await db.saveAccount({
                    type: 'receber',
                    desc: `Fecham. Condicional: ${data.docId}`,
                    client_id: data.client_id,
                    amount: data.total,
                    dueDate: dueDate,
                    status: 'pendente'
                });
                await db.updateClientBalance(data.client_id, -data.total);
            } else {
                await db.addTransaction({
                    type: 'receita',
                    desc: `Faturam. Condicional: ${data.docId}`,
                    amount: data.total,
                    category: 'Vendas'
                });
            }

            // Restaura o botão de confirmação padrão do checkout para vendas normais
            app.closeModal('modal-checkout');
            
            // Restaura listener original no botão do checkout
            const btn = document.getElementById('btn-confirm-checkout');
            const originalBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(originalBtn, btn);
            originalBtn.addEventListener('click', () => app.pdv.finishSale());

            // Mostra comprovante atualizado
            if (originalDoc) {
                app.pdv.showReceipt(originalDoc);
            }

            await app.showAlert('Condicional faturado com sucesso!');
            await this.render();
        } catch (e) {
            await app.showAlert('Erro ao finalizar venda do condicional: ' + e.message);
        }
    }
};
