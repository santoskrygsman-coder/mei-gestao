// js/pdv.js

import { db } from './database.js';
import { app } from './app.js';

export const pdv = {
    cart: [], // { product: p, qty: n }
    selectedClientId: 'c1',
    discount: 0.00,
    addition: 0.00,
    suspendedSales: [],
    activeReceiptDoc: null,

    init() {
        // Atalhos de teclado no PDV
        window.addEventListener('keydown', (e) => {
            if (app.currentView !== 'pdv') return;

            if (e.key === 'F2') {
                e.preventDefault();
                this.openCheckout();
            } else if (e.key === 'F4') {
                e.preventDefault();
                this.searchProductByName();
            } else if (e.key === 'F7') {
                e.preventDefault();
                this.toggleSuspension();
            } else if (e.key === 'Escape') {
                if (this.cart.length > 0 && confirm('Deseja realmente limpar o caixa atual?')) {
                    e.preventDefault();
                    this.clearPDV();
                }
            }
        });

        // Ouvinte do botão de pausar venda (F7)
        const btnPause = document.getElementById('btn-pdv-pause-sale');
        if (btnPause) {
            btnPause.addEventListener('click', () => this.toggleSuspension());
        }

        // Ouvinte do botão de recuperar venda pausada
        const btnResume = document.getElementById('btn-pdv-resume-sale');
        if (btnResume) {
            btnResume.addEventListener('click', () => this.resumeSale());
        }

        // Ouvinte do botão de compartilhar cupom no WhatsApp
        const btnWa = document.getElementById('btn-receipt-whatsapp');
        if (btnWa) {
            btnWa.addEventListener('click', () => this.sendReceiptWhatsApp());
        }

        // Evento de submit do campo de código de barras
        const barcodeInput = document.getElementById('pdv-barcode-input');
        if (barcodeInput) {
            barcodeInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleBarcodeSubmit();
                }
            });
            // Tenta manter o foco no campo de código de barras ao clicar no container do caixa
            document.querySelector('.pdv-cart').addEventListener('click', () => {
                barcodeInput.focus();
            });
        }

        // Listener do botão de busca por nome
        const btnSearch = document.getElementById('btn-pdv-search-product');
        if (btnSearch) {
            btnSearch.addEventListener('click', () => this.searchProductByName());
        }

        // Listeners de desconto e acréscimo
        const discountInput = document.getElementById('pdv-discount');
        const additionInput = document.getElementById('pdv-addition');
        
        if (discountInput) {
            discountInput.addEventListener('input', (e) => {
                this.discount = parseFloat(e.target.value) || 0;
                this.updateTotals();
            });
        }
        if (additionInput) {
            additionInput.addEventListener('input', (e) => {
                this.addition = parseFloat(e.target.value) || 0;
                this.updateTotals();
            });
        }

        // Seleção de cliente
        const clientSelect = document.getElementById('pdv-client-select');
        if (clientSelect) {
            clientSelect.addEventListener('change', (e) => {
                this.selectedClientId = e.target.value;
            });
        }

        // Ações de fechamento
        const btnOrcamento = document.getElementById('btn-pdv-save-orcamento');
        if (btnOrcamento) {
            btnOrcamento.addEventListener('click', () => this.saveAsOrcamento());
        }

        const btnCondicional = document.getElementById('btn-pdv-save-condicional');
        if (btnCondicional) {
            btnCondicional.addEventListener('click', () => this.saveAsCondicional());
        }

        const btnFinish = document.getElementById('btn-pdv-finish');
        if (btnFinish) {
            btnFinish.addEventListener('click', () => this.openCheckout());
        }

        // Eventos do Modal de Checkout
        const paymentSelect = document.getElementById('checkout-payment-method');
        if (paymentSelect) {
            paymentSelect.addEventListener('change', (e) => {
                const cashGroup = document.getElementById('checkout-cash-received-group');
                const dueDateGroup = document.getElementById('checkout-due-date-group');
                
                cashGroup.style.display = e.target.value === 'Dinheiro' ? 'block' : 'none';
                dueDateGroup.style.display = e.target.value === 'Crediário' ? 'block' : 'none';
            });
        }

        const cashReceivedInput = document.getElementById('checkout-cash-received');
        if (cashReceivedInput) {
            cashReceivedInput.addEventListener('input', () => this.calculateChange());
        }

        const useCreditCheck = document.getElementById('checkout-use-credit-check');
        if (useCreditCheck) {
            useCreditCheck.addEventListener('change', () => this.updateCheckoutTotals());
        }

        const btnConfirmCheckout = document.getElementById('btn-confirm-checkout');
        if (btnConfirmCheckout) {
            btnConfirmCheckout.addEventListener('click', () => this.finishSale());
        }
    },

    render() {
        this.renderClients();
        this.renderSimulatorButtons();
        this.renderCart();
        
        // Foca no input de código de barras
        const input = document.getElementById('pdv-barcode-input');
        if (input) {
            setTimeout(() => input.focus(), 100);
        }
    },

    async renderClients() {
        try {
            const clients = await db.getClients();
            const select = document.getElementById('pdv-client-select');
            if (!select) return;

            select.innerHTML = '';
            clients.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                const balanceSuffix = c.balance < 0 ? ` (Dév: ${app.formatCurrency(Math.abs(c.balance))})` : '';
                opt.textContent = `${c.name}${balanceSuffix}`;
                select.appendChild(opt);
            });

            select.value = this.selectedClientId;
        } catch (e) {
            console.error('Erro ao listar clientes no PDV:', e);
        }
    },

    async renderSimulatorButtons() {
        try {
            const products = await db.getProducts();
            const container = document.getElementById('pdv-simulator-products');
            if (!container) return;

            container.innerHTML = '';
            products.forEach(p => {
                const btn = document.createElement('button');
                btn.className = 'simulator-btn';
                btn.type = 'button';
                btn.innerHTML = `<i class="fa-solid fa-barcode"></i> ${p.name} (${app.formatCurrency(p.price)})`;
                btn.addEventListener('click', () => {
                    this.scanBarcode(p.barcode);
                });
                container.appendChild(btn);
            });
        } catch (e) {
            console.error(e);
        }
    },

    handleBarcodeSubmit() {
        const input = document.getElementById('pdv-barcode-input');
        const barcode = input.value.trim();
        if (barcode) {
            this.scanBarcode(barcode);
            input.value = '';
        }
    },

    async scanBarcode(barcode) {
        try {
            const products = await db.getProducts();
            const p = products.find(prod => prod.barcode === barcode);
            if (p) {
                app.triggerBeep();
                
                // Verifica se produto já está no carrinho
                const cartItem = this.cart.find(item => item.product.id === p.id);
                if (cartItem) {
                    cartItem.qty += 1;
                } else {
                    this.cart.push({ product: p, qty: 1 });
                }
                this.renderCart();
            } else {
                alert(`Produto com código de barras [${barcode}] não cadastrado!`);
            }
            
            // Mantém foco no input
            const input = document.getElementById('pdv-barcode-input');
            if (input) input.focus();
        } catch (e) {
            console.error('Erro ao ler código de barras:', e);
        }
    },

    async searchProductByName() {
        const query = prompt('Digite o nome ou parte do nome do produto:');
        if (!query) return;

        try {
            const products = await db.getProducts();
            const matches = products.filter(p => 
                p.name.toLowerCase().includes(query.toLowerCase())
            );

            if (matches.length === 0) {
                alert('Nenhum produto encontrado com este nome.');
            } else if (matches.length === 1) {
                await this.scanBarcode(matches[0].barcode);
            } else {
                // Mais de um correspondente, deixa escolher
                let promptText = 'Vários produtos encontrados, digite o número correspondente:\n';
                matches.forEach((p, idx) => {
                    promptText += `${idx + 1} - ${p.name} (Estoque: ${p.stock} | ${app.formatCurrency(p.price)})\n`;
                });
                const choice = parseInt(prompt(promptText)) - 1;
                if (choice >= 0 && choice < matches.length) {
                    await this.scanBarcode(matches[choice].barcode);
                }
            }
        } catch (e) {
            console.error('Erro ao buscar produto por nome:', e);
        }
    },

    renderCart() {
        const container = document.getElementById('pdv-cart-items');
        if (!container) return;

        container.innerHTML = '';
        
        if (this.cart.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-muted);"><i class="fa-solid fa-basket-shopping" style="font-size: 2.5rem; margin-bottom: 1rem; display: block;"></i>Carrinho Vazio</div>';
            this.updateTotals();
            return;
        }

        this.cart.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'pdv-cart-item';

            const itemTotal = item.qty * item.product.price;

            div.innerHTML = `
                <div>
                    <span style="font-weight: 600;">${item.product.name}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Ref: ${item.product.barcode}</span>
                </div>
                <div>
                    <input type="number" min="1" class="form-control" value="${item.qty}" style="width: 60px; padding: 0.25rem;" onchange="app.pdv.updateQty(${idx}, this.value)">
                </div>
                <div>${app.formatCurrency(item.product.price)}</div>
                <div class="item-total">${app.formatCurrency(itemTotal)}</div>
                <div>
                    <button type="button" onclick="app.pdv.removeItem(${idx})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });

        this.updateTotals();
    },

    updateQty(idx, qtyVal) {
        const qty = parseInt(qtyVal) || 1;
        if (qty > 0) {
            this.cart[idx].qty = qty;
            this.renderCart();
        }
    },

    removeItem(idx) {
        this.cart.splice(idx, 1);
        this.renderCart();
    },

    getSubtotal() {
        return this.cart.reduce((sum, item) => sum + (item.qty * item.product.price), 0);
    },

    getTotal() {
        const subtotal = this.getSubtotal();
        const total = subtotal - this.discount + this.addition;
        return Math.max(0, total);
    },

    updateTotals() {
        const total = this.getTotal();
        document.getElementById('pdv-total-display').textContent = app.formatCurrency(total);
    },

    clearPDV() {
        this.cart = [];
        this.discount = 0.00;
        this.addition = 0.00;
        
        const discInput = document.getElementById('pdv-discount');
        const addInput = document.getElementById('pdv-addition');
        if (discInput) discInput.value = '0.00';
        if (addInput) addInput.value = '0.00';
        
        this.renderCart();
    },

    // --- ORÇAMENTO ---
    async saveAsOrcamento() {
        if (this.cart.length === 0) {
            alert('Carrinho vazio.');
            return;
        }

        try {
            const clients = await db.getClients();
            const client = clients.find(c => c.id === this.selectedClientId);
            
            const doc = {
                type: 'orcamento',
                client_id: this.selectedClientId,
                client_name: client ? client.name : 'Consumidor Geral',
                items: this.cart.map(item => ({
                    id: item.product.id,
                    name: item.product.name,
                    price: item.product.price,
                    qty: item.qty
                })),
                discount: this.discount,
                addition: this.addition,
                total: this.getTotal(),
                status: 'aberto'
            };

            const saved = await db.saveDocument(doc);
            this.clearPDV();
            await this.showReceipt(saved);
            alert('Orçamento salvo com sucesso!');
        } catch (e) {
            alert('Erro ao salvar orçamento: ' + e.message);
        }
    },

    // --- CONDICIONAL ---
    async saveAsCondicional() {
        if (this.cart.length === 0) {
            alert('Carrinho vazio.');
            return;
        }

        if (this.selectedClientId === 'c1') {
            alert('Por favor, selecione um cliente cadastrado para saídas condicionais. Não é possível gerar condicional para "Consumidor Geral".');
            return;
        }

        try {
            const clients = await db.getClients();
            const client = clients.find(c => c.id === this.selectedClientId);

            // Verifica estoque e bloqueia itens
            for (const item of this.cart) {
                if (item.product.stock < item.qty) {
                    alert(`Estoque insuficiente de [${item.product.name}]. Estoque atual: ${item.product.stock}`);
                    return;
                }
            }

            // Decrementa o estoque físico (reserva)
            for (const item of this.cart) {
                await db.adjustStock(item.product.id, -item.qty);
            }

            const doc = {
                type: 'condicional',
                client_id: this.selectedClientId,
                client_name: client ? client.name : 'Desconhecido',
                items: this.cart.map(item => ({
                    id: item.product.id,
                    name: item.product.name,
                    price: item.product.price,
                    qty: item.qty,
                    returnedQty: 0 // Quantidade já devolvida pelo cliente
                })),
                discount: this.discount,
                addition: this.addition,
                total: this.getTotal(),
                status: 'aberto'
            };

            const saved = await db.saveDocument(doc);
            this.clearPDV();
            await this.showReceipt(saved);
            alert('Saída condicional gerada! Estoque reservado.');
        } catch (e) {
            alert('Erro ao salvar condicional: ' + e.message);
        }
    },

    // --- VENDA / PAGAMENTO ---
    async openCheckout() {
        if (this.cart.length === 0) {
            alert('Carrinho vazio.');
            return;
        }

        // Valida estoque físico antes de abrir checkout
        for (const item of this.cart) {
            if (item.product.stock < item.qty) {
                alert(`Estoque insuficiente de [${item.product.name}]. Estoque atual: ${item.product.stock}`);
                return;
            }
        }

        const total = this.getTotal();
        document.getElementById('checkout-total-display').textContent = app.formatCurrency(total);
        
        // Define valor recebido padrão para dinheiro igual ao total
        document.getElementById('checkout-cash-received').value = total.toFixed(2);
        
        // Define data de vencimento padrão do crediário para 30 dias à frente
        const in30Days = new Date();
        in30Days.setDate(in30Days.getDate() + 30);
        document.getElementById('checkout-due-date').value = in30Days.toISOString().split('T')[0];

        // Reseta visibilidade dos grupos
        document.getElementById('checkout-payment-method').value = 'Dinheiro';
        document.getElementById('checkout-cash-received-group').style.display = 'block';
        document.getElementById('checkout-due-date-group').style.display = 'none';

        // Verifica crédito do cliente
        const useCreditCheck = document.getElementById('checkout-use-credit-check');
        const creditBox = document.getElementById('checkout-credit-box');
        const creditAvailable = document.getElementById('checkout-credit-available');
        const creditValueToUse = document.getElementById('checkout-credit-value-to-use');

        if (useCreditCheck) useCreditCheck.checked = false; // Começa desmarcado

        try {
            // Busca e cacheia clientes para consultas síncronas rápidas nos inputs
            this.cachedClients = await db.getClients();

            if (this.selectedClientId !== 'c1') {
                const client = this.cachedClients.find(c => c.id === this.selectedClientId);
                if (client && client.balance > 0) {
                    if (creditBox && creditAvailable && creditValueToUse) {
                        creditBox.style.display = 'block';
                        creditAvailable.textContent = app.formatCurrency(client.balance);
                        const maxCreditToUse = Math.min(client.balance, total);
                        creditValueToUse.textContent = app.formatCurrency(maxCreditToUse);
                    }
                } else {
                    if (creditBox) creditBox.style.display = 'none';
                }
            } else {
                if (creditBox) creditBox.style.display = 'none';
            }

            this.updateCheckoutTotals();
            app.openModal('modal-checkout');
        } catch (e) {
            console.error('Erro ao abrir checkout:', e);
        }
    },

    calculateChange() {
        const total = this.getTotal();
        let remaining = total;
        const useCreditCheck = document.getElementById('checkout-use-credit-check');
        if (useCreditCheck && useCreditCheck.checked && this.selectedClientId !== 'c1' && this.cachedClients) {
            const client = this.cachedClients.find(c => c.id === this.selectedClientId);
            if (client && client.balance > 0) {
                const creditToUse = Math.min(client.balance, total);
                remaining = total - creditToUse;
            }
        }
        const received = parseFloat(document.getElementById('checkout-cash-received').value) || 0;
        const change = Math.max(0, received - remaining);
        document.getElementById('checkout-change-display').textContent = app.formatCurrency(change);
    },

    updateCheckoutTotals() {
        const total = this.getTotal();
        const useCreditCheck = document.getElementById('checkout-use-credit-check');
        const remainingRow = document.getElementById('checkout-remaining-row');
        const remainingDisplay = document.getElementById('checkout-remaining-display');
        const cashReceivedInput = document.getElementById('checkout-cash-received');

        let remaining = total;

        if (useCreditCheck && useCreditCheck.checked && this.selectedClientId !== 'c1' && this.cachedClients) {
            const client = this.cachedClients.find(c => c.id === this.selectedClientId);
            if (client && client.balance > 0) {
                const creditToUse = Math.min(client.balance, total);
                remaining = total - creditToUse;

                if (remainingRow && remainingDisplay) {
                    remainingRow.style.display = 'block';
                    remainingDisplay.textContent = app.formatCurrency(remaining);
                }
            }
        } else {
            if (remainingRow) remainingRow.style.display = 'none';
        }

        if (cashReceivedInput) {
            cashReceivedInput.value = remaining.toFixed(2);
        }

        this.calculateChange();
    },

    async finishSale() {
        const payMethod = document.getElementById('checkout-payment-method').value;
        
        if (!this.cachedClients) {
            this.cachedClients = await db.getClients();
        }
        const client = this.cachedClients.find(c => c.id === this.selectedClientId);

        if (payMethod === 'Crediário' && this.selectedClientId === 'c1') {
            alert('Selecione um cliente específico para compras a prazo.');
            return;
        }

        const total = this.getTotal();

        const useCreditCheck = document.getElementById('checkout-use-credit-check');
        let creditUsed = 0;
        if (useCreditCheck && useCreditCheck.checked && this.selectedClientId !== 'c1') {
            if (client && client.balance > 0) {
                creditUsed = Math.min(client.balance, total);
            }
        }

        const remaining = total - creditUsed;

        for (const item of this.cart) {
            if (item.product.stock < item.qty) {
                alert(`Estoque insuficiente de [${item.product.name}]. Estoque atual: ${item.product.stock}`);
                return;
            }
        }

        try {
            for (const item of this.cart) {
                await db.adjustStock(item.product.id, -item.qty);
            }

            const doc = {
                type: 'venda',
                client_id: this.selectedClientId,
                client_name: client ? client.name : 'Consumidor Geral',
                items: this.cart.map(item => ({
                    id: item.product.id,
                    name: item.product.name,
                    price: item.product.price,
                    qty: item.qty
                })),
                discount: this.discount,
                addition: this.addition,
                total: total,
                creditUsed: creditUsed,
                remaining: remaining,
                status: 'finalizado',
                paymentMethod: payMethod
            };

            const saved = await db.saveDocument(doc);

            if (creditUsed > 0) {
                await db.updateClientBalance(this.selectedClientId, -creditUsed);
            }

            if (remaining > 0) {
                if (payMethod === 'Crediário') {
                    const dueDate = document.getElementById('checkout-due-date').value;
                    await db.saveAccount({
                        type: 'receber',
                        desc: `Venda a prazo: ${saved.id}`,
                        client_id: this.selectedClientId,
                        amount: remaining,
                        dueDate: dueDate,
                        status: 'pendente'
                    });
                    await db.updateClientBalance(this.selectedClientId, -remaining);
                } else {
                    await db.addTransaction({
                        type: 'receita',
                        desc: `Venda PDV: ${saved.id}${creditUsed > 0 ? ' (Abatido Crédito)' : ''}`,
                        amount: remaining,
                        category: 'Vendas'
                    });
                }
            }

            app.closeModal('modal-checkout');
            this.clearPDV();
            await this.showReceipt(saved);
            
            alert('Venda finalizada com sucesso!');
        } catch (e) {
            alert('Erro ao finalizar venda: ' + e.message);
        }
    },

    // --- COMPROVANTE NÃO FISCAL (CUPOM 80MM) ---
    async showReceipt(doc) {
        this.activeReceiptDoc = doc;
        const container = document.getElementById('receipt-container');
        if (!container) return;

        try {
            const config = await db.getConfig();

            let itemsHtml = '';
            let subtotal = 0;
            doc.items.forEach(item => {
                const itemTotal = item.qty * item.price;
                subtotal += itemTotal;
                itemsHtml += `
    <div class="receipt-item">
        <span>${item.qty}x ${item.name.substring(0, 18)}</span>
        <span>${app.formatCurrency(itemTotal)}</span>
    </div>`;
            });

            const formattedDate = app.formatDate(doc.date);

            const titleMap = {
                orcamento: 'ORÇAMENTO (SEM VALOR FISCAL)',
                condicional: 'SAÍDA CONDICIONAL (CONTROLE)',
                venda: 'COMPROVANTE DE VENDA'
            };

            const statusMap = {
                aberto: 'ABERTO / PENDENTE',
                finalizado: 'PAGO / CONCLUÍDO',
                cancelado: 'CANCELADO'
            };

            const documentTitle = titleMap[doc.type] || 'DOCUMENTO';
            const logo = config.logo_base64 || config.logoBase64;
            const name = config.name || config.companyName || 'MEU NEGÓCIO MEI';
            const cnpj = config.cnpj || '00.000.000/0001-00';
            const phone = config.phone || '(00) 00000-0000';
            const address = config.address;
            const footer = config.footer_message || config.footerMessage || 'Obrigado pela preferência!';

            container.innerHTML = `
                <div class="receipt-wrapper">
                    <div class="receipt-header">
                        ${logo ? `<img src="${logo}" style="max-height: 48px; max-width: 100%; display: block; margin: 0 auto 0.5rem; filter: grayscale(100%);">` : ''}
                        <h4>${name}</h4>
                        <p style="font-size:0.7rem; color:#475569; margin-top:0.15rem;">CNPJ: ${cnpj}</p>
                        <p style="font-size:0.7rem; color:#475569;">Fone: ${phone}</p>
                        ${address ? `<p style="font-size:0.65rem; color:#475569; max-width:280px; margin:0 auto;">End: ${address}</p>` : ''}
                        <p style="font-size:0.68rem; margin-top:0.35rem; font-weight:600;">Data: ${formattedDate} | Doc: ${doc.id}</p>
                    </div>
                    <div class="receipt-divider"></div>
                    <p><strong>CLIENTE:</strong> ${doc.client_name}</p>
                    <div class="receipt-divider"></div>
                    <p><strong>ITENS:</strong></p>
                    <div class="receipt-items">
                        ${itemsHtml}
                    </div>
                    <div class="receipt-divider"></div>
                    <div class="receipt-item">
                        <span>Subtotal:</span>
                        <span>${app.formatCurrency(subtotal)}</span>
                    </div>
                    ${doc.discount > 0 ? `
                    <div class="receipt-item text-danger">
                        <span>Desconto:</span>
                        <span>- ${app.formatCurrency(doc.discount)}</span>
                    </div>` : ''}
                    ${doc.addition > 0 ? `
                    <div class="receipt-item text-success">
                        <span>Acréscimo:</span>
                        <span>+ ${app.formatCurrency(doc.addition)}</span>
                    </div>` : ''}
                    <div class="receipt-divider"></div>
                    <div class="receipt-item receipt-totals">
                        <span>TOTAL COMPRA:</span>
                        <span>${app.formatCurrency(doc.total)}</span>
                    </div>
                    ${doc.creditUsed > 0 ? `
                    <div class="receipt-item" style="color: #047857; font-weight: 600;">
                        <span>Crédito Utilizado:</span>
                        <span>- ${app.formatCurrency(doc.creditUsed)}</span>
                    </div>
                    <div class="receipt-item receipt-totals" style="color: #b45309;">
                        <span>SALDO A PAGAR:</span>
                        <span>${app.formatCurrency(doc.remaining)}</span>
                    </div>` : ''}
                    
                    ${doc.paymentMethod ? `
                    <div style="margin-top:0.5rem;">
                        <p><strong>PAGAMENTO:</strong> ${doc.paymentMethod}</p>
                    </div>` : ''}

                    <div class="receipt-divider"></div>
                    <div class="receipt-footer">
                        <p><strong>STATUS:</strong> ${statusMap[doc.status] || doc.status}</p>
                        <p style="margin-top:0.5rem; font-size:0.65rem;">${footer}</p>
                    </div>
                </div>
            `;

            app.openModal('modal-receipt');
        } catch (e) {
            console.error('Erro ao renderizar comprovante:', e);
        }
    },

    async suspendSale() {
        if (this.cart.length === 0) return;

        try {
            const clients = await db.getClients();
            const client = clients.find(c => c.id === this.selectedClientId);
            this.suspendedSales.push({
                client_id: this.selectedClientId,
                client_name: client ? client.name : 'Consumidor Geral',
                cart: [...this.cart],
                discount: this.discount,
                addition: this.addition
            });

            this.clearPDV();
            this.updateSuspensionUI();
            app.triggerBeep();
            alert('Venda suspensa! O caixa está livre.');
        } catch (e) {
            console.error(e);
        }
    },

    resumeSale() {
        if (this.suspendedSales.length === 0) return;

        const restored = this.suspendedSales.pop();
        if (restored) {
            this.cart = restored.cart;
            this.selectedClientId = restored.client_id;
            this.discount = restored.discount;
            this.addition = restored.addition;

            document.getElementById('pdv-discount').value = this.discount.toFixed(2);
            document.getElementById('pdv-addition').value = this.addition.toFixed(2);

            this.renderCart();
            this.renderClients();
            this.updateSuspensionUI();
            
            document.getElementById('pdv-barcode-input').focus();
        }
    },

    updateSuspensionUI() {
        const container = document.getElementById('pdv-suspended-sales-container');
        const countSpan = document.getElementById('pdv-suspended-sales-count');
        
        if (!container || !countSpan) return;

        if (this.suspendedSales.length > 0) {
            container.style.display = 'flex';
            countSpan.textContent = `${this.suspendedSales.length} Pausada(s)`;
        } else {
            container.style.display = 'none';
        }
    },

    toggleSuspension() {
        if (this.cart.length > 0) {
            this.suspendSale();
        } else if (this.suspendedSales.length > 0) {
            this.resumeSale();
        } else {
            alert('Não há itens no caixa para pausar, e nenhuma venda está suspensa.');
        }
    },

    sendReceiptWhatsApp() {
        if (!this.activeReceiptDoc) {
            alert('Nenhum comprovante disponível para compartilhar.');
            return;
        }
        app.sendReceiptWhatsApp(this.activeReceiptDoc);
    },

    async openSalesHistory() {
        try {
            const allDocs = await db.getDocuments();
            const docs = allDocs.filter(d => d.type === 'venda');
            const tbody = document.getElementById('sales-history-tbody');
            if (!tbody) return;

            tbody.innerHTML = '';
            
            const sortedDocs = [...docs].reverse();

            if (sortedDocs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align: center;">Nenhuma venda registrada.</td></tr>';
                app.openModal('modal-sales-history');
                return;
            }

            const loggedUser = JSON.parse(sessionStorage.getItem('loggedUser')) || {};
            const isAdmin = loggedUser.role === 'admin';

            sortedDocs.forEach(doc => {
                const tr = document.createElement('tr');
                
                const isCancelled = doc.status === 'cancelada';
                const statusBadge = isCancelled
                    ? `<span class="badge badge-danger">Cancelada</span>`
                    : `<span class="badge badge-success">Finalizada</span>`;

                const formattedDate = app.formatDate(doc.date);

                let btnCancel = '';
                if (isCancelled) {
                    btnCancel = `<button class="btn btn-secondary btn-sm" disabled style="opacity:0.4; padding:0.35rem 0.6rem;"><i class="fa-solid fa-ban"></i> Cancelada</button>`;
                } else if (!isAdmin) {
                    btnCancel = `<button class="btn btn-secondary btn-sm" disabled style="opacity:0.4; padding:0.35rem 0.6rem;" title="Apenas administradores podem cancelar"><i class="fa-solid fa-lock"></i> Restrito</button>`;
                } else {
                    btnCancel = `<button class="btn btn-danger btn-sm" onclick="app.pdv.cancelSale('${doc.id}')" style="padding:0.35rem 0.6rem;"><i class="fa-solid fa-xmark"></i> Cancelar</button>`;
                }

                tr.innerHTML = `
                    <td><strong>${doc.id}</strong></td>
                    <td>${formattedDate}</td>
                    <td>${doc.client_name}</td>
                    <td class="font-weight-600">${app.formatCurrency(doc.total)}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="flex-gap" style="justify-content: center;">
                            <button class="btn btn-primary btn-sm" onclick="app.pdv.printSaleReceipt('${doc.id}')" title="Reimprimir Cupom" style="padding:0.35rem 0.6rem;"><i class="fa-solid fa-print"></i> Ver</button>
                            ${btnCancel}
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            app.openModal('modal-sales-history');
        } catch (e) {
            console.error('Erro ao abrir histórico de vendas:', e);
        }
    },

    async printSaleReceipt(docId) {
        try {
            const docs = await db.getDocuments();
            const doc = docs.find(d => d.id === docId);
            if (doc) {
                app.closeModal('modal-sales-history');
                await this.showReceipt(doc);
            }
        } catch (e) {
            console.error(e);
        }
    },

    async cancelSale(docId) {
        if (!confirm(`Tem certeza absoluta que deseja CANCELAR a venda [${docId}]?\n\nEsta ação irá:\n1. Devolver os produtos ao estoque.\n2. Remover o lançamento financeiro correspondente.`)) {
            return;
        }

        try {
            await db.cancelDocument(docId);
            alert(`Venda [${docId}] cancelada e estoque/financeiro estornados com sucesso!`);
            
            await this.openSalesHistory();
            
            if (app.currentView === 'dashboard') await app.dashboard.render();
            if (app.currentView === 'estoque') await app.estoque.render();
            if (app.currentView === 'clientes') await app.clientes.render();
        } catch (e) {
            alert('Erro ao cancelar venda: ' + e.message);
        }
    }
};


