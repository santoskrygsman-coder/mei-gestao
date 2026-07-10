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
                this.startTour();
            }, 1500);
        }
    },

    startTour() {
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
    }
};

// Initialize if app is already loaded, otherwise it will be called by app.js
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    tour.init();
} else {
    document.addEventListener('DOMContentLoaded', () => tour.init());
}
