// js/tour.js

import { app } from './app.js';

export const tour = {
    init() {
        // Expose to global app object
        app.tour = this;

        // Verifica se é o primeiro acesso
        const hasSeenTour = localStorage.getItem('hasSeenTour_v1');
        if (!hasSeenTour) {
            // Pequeno delay para garantir que a tela carregou e as métricas estão visíveis
            setTimeout(() => {
                this.startGeneralTour();
            }, 1500);
        }
    },

    startGeneralTour() {
        if (!window.introJs) {
            console.error('Intro.js não carregado!');
            return;
        }

        // Se não estiver no dashboard, força a navegação para o Dashboard para iniciar o tour
        if (app.currentView !== 'dashboard') {
            app.switchView('dashboard');
        }

        const intro = introJs();
        
        intro.setOptions({
            nextLabel: 'Próximo',
            prevLabel: 'Anterior',
            doneLabel: 'Entendi!',
            skipLabel: 'Pular',
            showStepNumbers: true,
            exitOnOverlayClick: false,
            keyboardNavigation: true,
            steps: [
                {
                    title: '👋 Bem-vindo ao Sistema!',
                    intro: 'Este é um tour rápido para apresentar as principais funcionalidades e novidades do seu sistema de gestão.'
                },
                {
                    element: document.querySelector('[data-view="dashboard"]'),
                    title: 'Painel Geral',
                    intro: 'Aqui você tem a visão geral do seu negócio: Faturamento do dia, vendas da semana, contas a receber hoje, e alertas de estoque baixo.',
                    position: 'right'
                },
                {
                    element: document.querySelector('[data-view="pdv"]'),
                    title: 'Frente de Caixa (PDV)',
                    intro: 'A tela mais importante para o dia a dia! Aqui você registra vendas rápidas. Dica: você pode usar leitores de código de barras ou buscar pelo nome do produto.',
                    position: 'right'
                },
                {
                    element: document.querySelector('[data-view="estoque"]'),
                    title: 'Estoque & Compras',
                    intro: 'Cadastre seus produtos aqui. Novidade: Agora você pode importar Notas Fiscais (XML) para dar entrada automática no estoque e calcular custos!',
                    position: 'right'
                },
                {
                    element: document.querySelector('[data-view="documentos"]'),
                    title: 'Orçamentos & Condicional',
                    intro: 'Envie mercadorias em Condicional para seus clientes provarem em casa. Se eles ficarem com a peça, você transforma em venda faturada com um clique!',
                    position: 'right'
                },
                {
                    element: document.querySelector('[data-view="financeiro"]'),
                    title: 'Gestão Financeira',
                    intro: 'Controle seu Caixa, lance Contas a Pagar e acompanhe seus recebimentos (Crediário). Adicionamos filtros de busca rápidos aqui!',
                    position: 'right'
                },
                {
                    element: document.querySelector('[data-view="relatorios"]'),
                    title: 'Relatórios Inteligentes',
                    intro: 'Gere seu DRE Simplificado (Demonstrativo de Resultados) e descubra sua verdadeira Margem de Lucro e Ranking de Produtos mais vendidos.',
                    position: 'right'
                }
            ]
        });

        intro.oncomplete(() => {
            localStorage.setItem('hasSeenTour_v1', 'true');
        });

        intro.onexit(() => {
            localStorage.setItem('hasSeenTour_v1', 'true');
        });

        intro.start();
    },

    startProductTour() {
        if (!window.introJs) return;

        // Força a tela de estoque
        if (app.currentView !== 'estoque') {
            app.switchView('estoque');
        }

        const intro = introJs();
        
        intro.setOptions({
            nextLabel: 'Próximo',
            prevLabel: 'Anterior',
            doneLabel: 'Entendi!',
            skipLabel: 'Pular',
            showStepNumbers: true,
            exitOnOverlayClick: false,
            keyboardNavigation: true,
            steps: [
                {
                    title: '📦 Cadastro de Produto',
                    intro: 'Vamos aprender como cadastrar um produto novo no seu estoque de forma rápida!'
                },
                {
                    element: '#btn-new-product',
                    title: 'Novo Produto',
                    intro: 'Sempre que precisar cadastrar um produto manualmente, clique neste botão.',
                    position: 'bottom'
                },
                {
                    element: '#modal-product .modal-container',
                    title: 'Preenchendo os Dados',
                    intro: 'Aqui você informa os detalhes do produto. Vamos ver os campos principais.',
                    position: 'top'
                },
                {
                    element: '#prod-barcode',
                    title: 'Código de Barras',
                    intro: 'Opcional, mas muito recomendado! Você pode digitar ou bipar com o leitor. Isso agiliza muito a venda no PDV.',
                    position: 'right'
                },
                {
                    element: '#prod-price',
                    title: 'Preço de Venda',
                    intro: 'O valor final que será cobrado do cliente. Se você preencher o Preço de Custo, o sistema vai te mostrar a Margem de Lucro logo abaixo.',
                    position: 'left'
                },
                {
                    element: '#modal-product .btn-primary',
                    title: 'Salvar',
                    intro: 'Após preencher o Nome e o Preço, clique em Salvar e o produto já estará pronto para venda no Caixa!',
                    position: 'left'
                }
            ]
        });

        intro.onbeforechange(function(targetElement) {
            if (targetElement && targetElement.closest('#modal-product')) {
                app.openModal('modal-product');
                return new Promise(resolve => setTimeout(resolve, 300));
            } else {
                app.closeModal('modal-product');
            }
        });

        intro.start();
    },

    startPdvTour() {
        if (!window.introJs) return;
        if (app.currentView !== 'pdv') app.switchView('pdv');
        const intro = introJs();
        intro.setOptions({
            nextLabel: 'Próximo', prevLabel: 'Anterior', doneLabel: 'Entendi!', skipLabel: 'Pular', showStepNumbers: true, exitOnOverlayClick: false, keyboardNavigation: true,
            steps: [
                { title: '🛒 Frente de Caixa', intro: 'Vamos aprender a registrar uma venda e finalizar o pagamento.' },
                { element: '.pdv-cart', title: 'O Carrinho', intro: 'Aqui aparecerão os produtos que você buscar pelo nome ou bipar com o leitor.', position: 'right' },
                { element: '#btn-payment', title: 'Finalizar', intro: 'Após inserir os produtos, clique aqui para ir ao pagamento.', position: 'top' },
                { element: '#modal-checkout .modal-container', title: 'Recebendo o Valor', intro: 'Nesta janela você escolhe como o cliente vai pagar.', position: 'top' },
                { element: '#checkout-payment-method', title: 'Forma de Pagamento', intro: 'Selecione Dinheiro, PIX, Cartão, ou Crediário.', position: 'right' },
                { element: '#btn-confirm-checkout', title: 'Confirmar', intro: 'Pronto! É só confirmar e a venda será registrada no sistema.', position: 'bottom' }
            ]
        });
        intro.onbeforechange(function(targetElement) {
            if (targetElement && targetElement.closest('#modal-checkout')) {
                app.openModal('modal-checkout');
                return new Promise(resolve => setTimeout(resolve, 300));
            } else {
                app.closeModal('modal-checkout');
            }
        });
        intro.start();
    },

    startFinanceiroTour() {
        if (!window.introJs) return;
        if (app.currentView !== 'financeiro') app.switchView('financeiro');
        const intro = introJs();
        intro.setOptions({
            nextLabel: 'Próximo', prevLabel: 'Anterior', doneLabel: 'Entendi!', skipLabel: 'Pular', showStepNumbers: true, exitOnOverlayClick: false, keyboardNavigation: true,
            steps: [
                { title: '💸 Gestão Financeira', intro: 'Controle o que entra e sai do seu caixa, além de contas a prazo.' },
                { element: '#table-payable', title: 'Contas a Pagar', intro: 'Aqui ficam suas despesas futuras, como boletos e fornecedores.', position: 'right' },
                { element: '#filter-payable', title: 'Busca Rápida', intro: 'Você pode pesquisar qualquer conta digitando o nome do fornecedor ou a descrição.', position: 'bottom' },
                { element: '#btn-new-payable', title: 'Nova Conta', intro: 'Clique aqui para adicionar uma nova despesa pendente.', position: 'left' },
                { element: '#table-receivable', title: 'Contas a Receber (Crediário)', intro: 'Aqui ficam os valores que seus clientes devem (vendas a prazo/fiado).', position: 'top' }
            ]
        });
        intro.start();
    },

    startClientTour() {
        if (!window.introJs) return;
        if (app.currentView !== 'clientes') app.switchView('clientes');
        const intro = introJs();
        intro.setOptions({
            nextLabel: 'Próximo', prevLabel: 'Anterior', doneLabel: 'Entendi!', skipLabel: 'Pular', showStepNumbers: true, exitOnOverlayClick: false, keyboardNavigation: true,
            steps: [
                { title: '👥 Clientes', intro: 'Aprenda a cadastrar os seus clientes no sistema.' },
                { element: '#btn-new-client', title: 'Novo Cliente', intro: 'Clique neste botão para abrir o cadastro.', position: 'bottom' },
                { element: '#modal-client .modal-container', title: 'Dados do Cliente', intro: 'Esta é a ficha do seu cliente.', position: 'top' },
                { element: '#cli-name', title: 'Nome', intro: 'Preencha o nome completo ou apelido.', position: 'right' },
                { element: '#cli-whatsapp', title: 'WhatsApp', intro: 'Importante! Coloque o WhatsApp com DDD para poder enviar recibos digitais para ele depois.', position: 'left' },
                { element: '#modal-client .btn-primary', title: 'Salvar', intro: 'Depois de preencher, é só clicar aqui.', position: 'top' }
            ]
        });
        intro.onbeforechange(function(targetElement) {
            if (targetElement && targetElement.closest('#modal-client')) {
                app.openModal('modal-client');
                return new Promise(resolve => setTimeout(resolve, 300));
            } else {
                app.closeModal('modal-client');
            }
        });
        intro.start();
    }
};

// Initialize if app is already loaded, otherwise it will be called by app.js
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    tour.init();
} else {
    document.addEventListener('DOMContentLoaded', () => tour.init());
}
