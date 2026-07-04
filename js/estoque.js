// js/estoque.js

import { db } from './database.js';
import { app } from './app.js';

export const estoque = {
    init() {
        // Eventos de Importação de XML
        const btnImportXml = document.getElementById('btn-import-xml');
        if (btnImportXml) {
            btnImportXml.addEventListener('click', () => this.openXmlImportModal());
        }

        const dropZone = document.getElementById('xml-drop-zone');
        const fileInput = document.getElementById('input-xml-file');
        
        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.handleXmlFile(file);
            });

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.style.background = 'rgba(59, 130, 246, 0.15)';
                dropZone.style.borderColor = 'var(--primary-hover)';
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.style.background = 'rgba(59, 130, 246, 0.05)';
                dropZone.style.borderColor = 'var(--primary)';
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.style.background = 'rgba(59, 130, 246, 0.05)';
                dropZone.style.borderColor = 'var(--primary)';
                const file = e.dataTransfer.files[0];
                if (file) this.handleXmlFile(file);
            });
        }

        const btnConfirmXml = document.getElementById('btn-confirm-xml-import');
        if (btnConfirmXml) {
            btnConfirmXml.addEventListener('click', () => this.confirmXmlImport());
        }

        const formProduct = document.getElementById('form-product');
        if (formProduct) {
            formProduct.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProduct();
            });
        }

        const btnNew = document.getElementById('btn-new-product');
        if (btnNew) {
            btnNew.addEventListener('click', () => this.openProductModal());
        }

        const btnPurchase = document.getElementById('btn-purchase-entry');
        if (btnPurchase) {
            btnPurchase.addEventListener('click', () => this.openPurchaseModal());
        }

        // Eventos do modal de compra
        const formPurchase = document.getElementById('form-purchase');
        if (formPurchase) {
            formPurchase.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePurchase();
            });
        }

        // Listener para mudar produto selecionado no modal de compra
        const purProductSelect = document.getElementById('pur-product-select');
        if (purProductSelect) {
            purProductSelect.addEventListener('change', () => this.updatePurchaseProductDetails());
        }

        const btnStockAdjust = document.getElementById('btn-stock-adjust');
        if (btnStockAdjust) {
            btnStockAdjust.addEventListener('click', () => this.openStockAdjustModal());
        }

        const adjProductSelect = document.getElementById('adj-product-select');
        if (adjProductSelect) {
            adjProductSelect.addEventListener('change', () => this.updateStockAdjustCurrentStock());
        }

        const formStockAdjust = document.getElementById('form-stock-adjust');
        if (formStockAdjust) {
            formStockAdjust.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveStockAdjust();
            });
        }

        // Listeners para atualizar simulação de custo médio em tempo real
        const purQty = document.getElementById('pur-qty');
        const purCost = document.getElementById('pur-cost');
        if (purQty && purCost) {
            purQty.addEventListener('input', () => this.simulateAverageCost());
            purCost.addEventListener('input', () => this.simulateAverageCost());
        }

        // Checkbox de atualizar preço de venda na compra
        const checkUpdatePrice = document.getElementById('pur-update-price-check');
        if (checkUpdatePrice) {
            checkUpdatePrice.addEventListener('change', (e) => {
                const group = document.getElementById('pur-new-price-group');
                group.style.display = e.target.checked ? 'block' : 'none';
            });
        }
    },

    async render() {
        try {
            const products = await db.getProducts();
            const tbody = document.getElementById('list-products-body');
            tbody.innerHTML = '';

            const loggedUser = JSON.parse(sessionStorage.getItem('loggedUser')) || {};
            const isAdmin = loggedUser.role === 'admin';

            // Oculta/Exibe botões administrativos do cabeçalho de Estoque
            const btnNew = document.getElementById('btn-new-product');
            const btnPurchase = document.getElementById('btn-purchase-entry');
            const btnImportXml = document.getElementById('btn-import-xml');
            const btnStockAdjust = document.getElementById('btn-stock-adjust');

            if (btnNew) btnNew.style.display = isAdmin ? 'inline-flex' : 'none';
            if (btnPurchase) btnPurchase.style.display = isAdmin ? 'inline-flex' : 'none';
            if (btnImportXml) btnImportXml.style.display = isAdmin ? 'inline-flex' : 'none';
            if (btnStockAdjust) btnStockAdjust.style.display = isAdmin ? 'inline-flex' : 'none';

            if (products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-muted" style="text-align: center;">Nenhum produto cadastrado.</td></tr>';
                return;
            }

            products.forEach(p => {
                const tr = document.createElement('tr');
                const isLowStock = (p.stock || 0) <= (p.minStock || 0);
                const stockClass = isLowStock ? 'text-danger font-weight-600' : '';

                const actionsHtml = isAdmin ? `
                    <div class="flex-gap">
                        <button class="btn btn-secondary btn-icon" onclick="app.estoque.openProductModal('${p.id}')" title="Editar">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-danger btn-icon" onclick="app.estoque.deleteProduct('${p.id}')" title="Excluir">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                ` : `<span class="text-muted" style="font-size:0.75rem;"><i class="fa-solid fa-lock"></i> Restrito</span>`;

                tr.innerHTML = `
                    <td><code style="font-family: monospace; font-size: 0.85rem; color: #60a5fa;">${p.barcode}</code></td>
                    <td>${p.name}</td>
                    <td>${p.category || '---'}</td>
                    <td>${app.formatCurrency(p.cost || 0)}</td>
                    <td>${app.formatCurrency(p.price || 0)}</td>
                    <td class="${stockClass}">${p.stock || 0} ${isLowStock ? '<span class="badge badge-danger" style="margin-left: 0.5rem; font-size: 0.65rem; padding: 0.15rem 0.35rem;"><i class="fa-solid fa-triangle-exclamation"></i> Baixo</span>' : ''}</td>
                    <td>${p.minStock || 0}</td>
                    <td>${actionsHtml}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            console.error('Erro ao listar produtos:', e);
        }
    },

    async openProductModal(id = null) {
        try {
            document.getElementById('form-product').reset();
            document.getElementById('prod-id').value = '';
            
            const stockField = document.getElementById('prod-stock');

            if (id) {
                const products = await db.getProducts();
                const p = products.find(item => item.id === id);
                if (p) {
                    document.getElementById('prod-id').value = p.id;
                    document.getElementById('prod-barcode').value = p.barcode;
                    document.getElementById('prod-name').value = p.name;
                    document.getElementById('prod-category').value = p.category || '';
                    document.getElementById('prod-min-stock').value = p.minStock || 0;
                    document.getElementById('prod-cost').value = p.cost || 0;
                    document.getElementById('prod-price').value = p.price || 0;
                    stockField.value = p.stock || 0;
                    stockField.disabled = true;

                    document.getElementById('modal-product-title').textContent = 'Editar Produto';
                }
            } else {
                stockField.disabled = false;
                document.getElementById('modal-product-title').textContent = 'Cadastrar Produto';
            }
            
            app.openModal('modal-product');
        } catch (e) {
            console.error(e);
        }
    },

    async saveProduct() {
        const id = document.getElementById('prod-id').value;
        const barcode = document.getElementById('prod-barcode').value;
        const name = document.getElementById('prod-name').value;
        const category = document.getElementById('prod-category').value;
        const minStock = parseInt(document.getElementById('prod-min-stock').value) || 0;
        const cost = parseFloat(document.getElementById('prod-cost').value) || 0;
        const price = parseFloat(document.getElementById('prod-price').value) || 0;
        const stock = parseInt(document.getElementById('prod-stock').value) || 0;

        const prodData = { barcode, name, category, minStock, cost, price };
        if (!id) {
            prodData.id = 'p_' + Date.now();
            prodData.stock = stock;
        } else {
            prodData.id = id;
        }

        try {
            await db.saveProduct(prodData);
            app.closeModal('modal-product');
            await this.render();
        } catch (e) {
            alert('Erro ao salvar produto: ' + e.message);
        }
    },

    async deleteProduct(id) {
        if (confirm('Deseja realmente excluir este produto?')) {
            try {
                await db.deleteProduct(id);
                await this.render();
            } catch (e) {
                alert('Erro ao excluir produto: ' + e.message);
            }
        }
    },

    // --- MODAL ENTRADA DE NOTA / COMPRAS ---
    async openPurchaseModal() {
        try {
            const products = await db.getProducts();
            const select = document.getElementById('pur-product-select');
            select.innerHTML = '<option value="">-- Selecione o Produto --</option>';

            products.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `${p.name} (Cód: ${p.barcode})`;
                select.appendChild(opt);
            });

            document.getElementById('form-purchase').reset();
            document.getElementById('pur-current-stock').value = '0';
            document.getElementById('pur-current-cost').value = app.formatCurrency(0);
            document.getElementById('pur-sim-stock').textContent = '0';
            document.getElementById('pur-sim-cost').textContent = app.formatCurrency(0);
            document.getElementById('pur-new-price-group').style.display = 'none';

            app.openModal('modal-purchase');
        } catch (e) {
            console.error(e);
        }
    },

    async updatePurchaseProductDetails() {
        const productId = document.getElementById('pur-product-select').value;
        const currentStockInput = document.getElementById('pur-current-stock');
        const currentCostInput = document.getElementById('pur-current-cost');

        if (!productId) {
            currentStockInput.value = '0';
            currentCostInput.value = app.formatCurrency(0);
            return;
        }

        try {
            const products = await db.getProducts();
            const p = products.find(item => item.id === productId);
            if (p) {
                currentStockInput.value = p.stock || 0;
                currentCostInput.value = app.formatCurrency(p.cost || 0);
                
                document.getElementById('pur-new-price').value = p.price || 0;

                await this.simulateAverageCost();
            }
        } catch (e) {
            console.error(e);
        }
    },

    async simulateAverageCost() {
        const productId = document.getElementById('pur-product-select').value;
        if (!productId) return;

        try {
            const products = await db.getProducts();
            const p = products.find(item => item.id === productId);
            if (!p) return;

            const currentStock = p.stock || 0;
            const currentCost = p.cost || 0;

            const qtyPurchased = parseInt(document.getElementById('pur-qty').value) || 0;
            const unitCost = parseFloat(document.getElementById('pur-cost').value) || 0;

            const simStock = currentStock + qtyPurchased;
            let simCost = currentCost;

            if (simStock > 0) {
                simCost = ((currentStock * currentCost) + (qtyPurchased * unitCost)) / simStock;
            } else {
                simCost = unitCost;
            }

            document.getElementById('pur-sim-stock').textContent = simStock;
            document.getElementById('pur-sim-cost').textContent = app.formatCurrency(simCost);
        } catch (e) {
            console.error(e);
        }
    },

    async savePurchase() {
        const productId = document.getElementById('pur-product-select').value;
        const qtyPurchased = parseInt(document.getElementById('pur-qty').value);
        const unitCost = parseFloat(document.getElementById('pur-cost').value);
        const updateSellingPrice = document.getElementById('pur-update-price-check').checked;
        const newSellingPrice = parseFloat(document.getElementById('pur-new-price').value);

        if (!productId) {
            alert('Por favor, selecione um produto.');
            return;
        }

        try {
            const updated = await db.processPurchase(productId, qtyPurchased, unitCost, updateSellingPrice, newSellingPrice);
            if (updated) {
                app.closeModal('modal-purchase');
                await this.render();
                alert(`Entrada efetuada com sucesso! Novo custo médio de ${updated.name}: ${app.formatCurrency(updated.cost)}`);
                if (app.currentView === 'dashboard') await app.dashboard.render();
            }
        } catch (e) {
            alert('Erro ao registrar compra de estoque: ' + e.message);
        }
    },

    // --- IMPORTAÇÃO DE XML (NF-e) ---
    parsedXmlInvoice: null,

    openXmlImportModal() {
        this.parsedXmlInvoice = null;
        document.getElementById('input-xml-file').value = '';
        document.getElementById('xml-invoice-details').style.display = 'none';
        document.getElementById('xml-conciliation-section').style.display = 'none';
        document.getElementById('xml-import-footer').style.display = 'none';
        
        const dropZone = document.getElementById('xml-drop-zone');
        dropZone.style.display = 'block';
        dropZone.style.background = 'rgba(59, 130, 246, 0.05)';
        dropZone.style.borderColor = 'var(--primary)';
        
        app.openModal('modal-xml-import');
    },

    handleXmlFile(file) {
        if (!file.name.endsWith('.xml') && file.type !== 'text/xml') {
            alert('Por favor, selecione um arquivo XML válido.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.parseXML(e.target.result);
        };
        reader.readAsText(file);
    },

    parseXML(xmlText) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            const infNFe = xmlDoc.querySelector('infNFe');
            if (!infNFe) {
                alert('O arquivo XML carregado não possui a tag <infNFe>. Certifique-se de que é uma Nota Fiscal de Produto (NF-e) válida.');
                return;
            }

            let chave = '';
            const chNFe = xmlDoc.querySelector('chNFe');
            if (chNFe) {
                chave = chNFe.textContent;
            } else {
                const idAttr = infNFe.getAttribute('Id');
                if (idAttr) chave = idAttr.replace('NFe', '');
            }

            const emitNome = xmlDoc.querySelector('emit > xNome')?.textContent || 'Fornecedor Desconhecido';
            const emitCNPJ = xmlDoc.querySelector('emit > CNPJ')?.textContent || '';

            const dhEmi = xmlDoc.querySelector('dhEmi')?.textContent || xmlDoc.querySelector('dEmi')?.textContent || '';
            const formattedDate = dhEmi ? dhEmi.substring(0, 10) : new Date().toISOString().split('T')[0];

            const detNodes = xmlDoc.querySelectorAll('det');
            const items = [];

            detNodes.forEach(det => {
                const cProd = det.querySelector('prod > cProd')?.textContent || '';
                const xProd = det.querySelector('prod > xProd')?.textContent || 'Produto sem nome';
                const cEAN = det.querySelector('prod > cEAN')?.textContent || '';
                const qCom = parseFloat(det.querySelector('prod > qCom')?.textContent) || 0;
                const vUnCom = parseFloat(det.querySelector('prod > vUnCom')?.textContent) || 0;
                const vProd = parseFloat(det.querySelector('prod > vProd')?.textContent) || 0;

                items.push({
                    cProd,
                    xProd,
                    cEAN,
                    qty: qCom,
                    cost: vUnCom,
                    total: vProd
                });
            });

            if (items.length === 0) {
                alert('Nenhum item de produto encontrado na nota.');
                return;
            }

            this.parsedXmlInvoice = {
                chave,
                emitente: emitNome,
                emitenteCNPJ: emitCNPJ,
                date: formattedDate,
                items
            };

            document.getElementById('xml-drop-zone').style.display = 'none';
            document.getElementById('xml-invoice-details').style.display = 'block';
            document.getElementById('xml-info-chave').textContent = chave ? `${chave.substring(0, 6)}...${chave.substring(38)}` : 'Não informada';
            document.getElementById('xml-info-emit').textContent = emitNome;
            document.getElementById('xml-info-date').textContent = new Date(formattedDate + 'T12:00:00').toLocaleDateString('pt-BR');

            this.renderXmlConciliationGrid();

        } catch (err) {
            console.error(err);
            alert('Falha ao processar arquivo XML da nota. Formato inválido ou corrompido.');
        }
    },

    async renderXmlConciliationGrid() {
        const tbody = document.getElementById('xml-items-body');
        if (!tbody) return;

        try {
            tbody.innerHTML = '';
            const products = await db.getProducts();

            this.parsedXmlInvoice.items.forEach((item, idx) => {
                const tr = document.createElement('tr');

                const isEanValid = item.cEAN && item.cEAN.trim() !== '' && item.cEAN.toUpperCase() !== 'SEM GTIN' && /^\d+$/.test(item.cEAN);
                let matchedProduct = null;
                if (isEanValid) {
                    matchedProduct = products.find(p => p.barcode === item.cEAN.trim());
                }

                if (!matchedProduct) {
                    matchedProduct = products.find(p => p.name.toLowerCase() === item.xProd.toLowerCase());
                }

                let selectHtml = `<select class="form-control xml-match-select" data-idx="${idx}" style="font-size:0.8rem; padding:0.25rem;">`;
                selectHtml += `<option value="NEW" ${!matchedProduct ? 'selected' : ''}>[NOVO] Cadastrar como Novo Produto</option>`;
                
                products.forEach(p => {
                    const isSelected = matchedProduct && matchedProduct.id === p.id ? 'selected' : '';
                    selectHtml += `<option value="${p.id}" ${isSelected}>${p.name} (Estoque: ${p.stock} | EAN: ${p.barcode})</option>`;
                });
                selectHtml += `</select>`;

                tr.innerHTML = `
                    <td>
                        <strong>${item.xProd}</strong><br>
                        <span class="text-muted" style="font-size: 0.75rem;">Cód. Fornecedor: ${item.cProd} | EAN: ${item.cEAN || 'Sem EAN'}</span>
                    </td>
                    <td>${item.qty} un</td>
                    <td>${app.formatCurrency(item.cost)}</td>
                    <td>${selectHtml}</td>
                `;

                tbody.appendChild(tr);
            });

            document.getElementById('xml-conciliation-section').style.display = 'block';
            document.getElementById('xml-import-footer').style.display = 'flex';
        } catch (e) {
            console.error(e);
        }
    },

    async confirmXmlImport() {
        if (!this.parsedXmlInvoice) return;

        const selects = document.querySelectorAll('.xml-match-select');
        let totalFinanceiro = 0;

        try {
            const config = await db.getConfig();
            const markupPercent = config.markup || 50;
            const priceMultiplier = 1 + (markupPercent / 100);

            for (const select of selects) {
                const idx = parseInt(select.getAttribute('data-idx'));
                const item = this.parsedXmlInvoice.items[idx];
                const choice = select.value;

                totalFinanceiro += item.total;

                if (choice === 'NEW') {
                    const isEanValid = item.cEAN && item.cEAN.trim() !== '' && item.cEAN.toUpperCase() !== 'SEM GTIN' && /^\d+$/.test(item.cEAN);
                    const barcode = isEanValid ? item.cEAN.trim() : '789' + Math.floor(Math.random() * 10000000000);
                    
                    const newProduct = await db.saveProduct({
                        id: 'p_' + Date.now() + '_' + idx,
                        barcode,
                        name: item.xProd,
                        cost: item.cost,
                        price: parseFloat((item.cost * priceMultiplier).toFixed(2)),
                        stock: 0,
                        minStock: 2,
                        category: 'Importado XML'
                    });

                    await db.processPurchase(newProduct.id, item.qty, item.cost);
                } else {
                    await db.processPurchase(choice, item.qty, item.cost);
                }
            }

            await db.addTransaction({
                type: 'despesa',
                desc: `Import. NF-e: Forn. ${this.parsedXmlInvoice.emitente}`,
                amount: parseFloat(totalFinanceiro.toFixed(2)),
                category: 'Estoque/Mercadoria'
            });

            app.closeModal('modal-xml-import');
            await this.render();
            alert(`Sucesso! Nota fiscal importada com sucesso. Estoque incrementado e custo médio recalculado.`);
            
            if (app.currentView === 'dashboard') {
                await app.dashboard.render();
            }
        } catch (e) {
            alert('Erro ao confirmar importação: ' + e.message);
        }
    },

    async openStockAdjustModal() {
        const form = document.getElementById('form-stock-adjust');
        if (form) form.reset();

        const select = document.getElementById('adj-product-select');
        if (!select) return;

        try {
            select.innerHTML = '';
            const products = await db.getProducts();

            if (products.length === 0) {
                alert('Não há produtos cadastrados para realizar ajuste.');
                return;
            }

            products.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `${p.name} (EAN: ${p.barcode})`;
                select.appendChild(opt);
            });

            await this.updateStockAdjustCurrentStock();
            app.openModal('modal-stock-adjust');
        } catch (e) {
            console.error(e);
        }
    },

    async updateStockAdjustCurrentStock() {
        const select = document.getElementById('adj-product-select');
        const inputCurrent = document.getElementById('adj-current-stock');
        if (!select || !inputCurrent) return;

        const prodId = select.value;
        try {
            const products = await db.getProducts();
            const prod = products.find(p => p.id === prodId);
            if (prod) {
                inputCurrent.value = prod.stock || 0;
            }
        } catch (e) {
            console.error(e);
        }
    },

    async saveStockAdjust() {
        const select = document.getElementById('adj-product-select');
        const inputNew = document.getElementById('adj-new-stock');
        const selectReason = document.getElementById('adj-reason');
        if (!select || !inputNew || !selectReason) return;

        const prodId = select.value;
        const newStock = parseInt(inputNew.value);
        const reason = selectReason.value;

        if (isNaN(newStock) || newStock < 0) {
            alert('Por favor, insira um estoque válido.');
            return;
        }

        try {
            const products = await db.getProducts();
            const prod = products.find(p => p.id === prodId);
            if (!prod) return;

            const currentStock = prod.stock || 0;
            const delta = newStock - currentStock;

            if (delta === 0) {
                alert('O novo estoque é igual ao atual. Nenhuma alteração realizada.');
                app.closeModal('modal-stock-adjust');
                return;
            }

            await db.adjustStock(prodId, delta);

            if (delta < 0 && (reason.includes('Perda') || reason.includes('Roubo'))) {
                const costLoss = Math.abs(delta) * (prod.cost || 0);
                if (costLoss > 0) {
                    await db.addTransaction({
                        type: 'despesa',
                        desc: `Ajuste Perda: ${Math.abs(delta)}x ${prod.name} (${reason})`,
                        amount: parseFloat(costLoss.toFixed(2)),
                        category: 'Outras Despesas'
                    });
                }
            }

            app.closeModal('modal-stock-adjust');
            await this.render();
            alert('Ajuste de estoque salvo com sucesso!');

            if (app.currentView === 'dashboard') {
                await app.dashboard.render();
            }
        } catch (e) {
            alert('Erro ao ajustar estoque: ' + e.message);
        }
    }
};


