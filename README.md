# MEI Fácil Gestão - Sistema de Controle Gerencial

Sistema gerencial web simplificado, leve e responsivo para microempreendedores individuais (MEI). Funciona diretamente no navegador, sem necessidade de servidores ou bancos de dados complexos (persiste dados localmente usando `LocalStorage`).

## 🚀 Funcionalidades

1. **Dashboard Gerencial**: Métricas de faturamento do mês atual, número de produtos, contagem de estoque crítico, contas a receber vencidas e gráfico diário de fluxo de caixa dos últimos 7 dias.
2. **PDV (Frente de Caixa)**:
   - Suporte rápido a leitor de código de barras (foco automático).
   - Simulador visual de leitor para realizar testes fáceis sem hardware.
   - Aplicação de acréscimo ou desconto.
   - Seleção de cliente.
   - Checkout com formas de pagamento (Dinheiro com cálculo de troco, Pix, Cartão de Crédito/Débito e Crediário/A prazo).
   - Emissão de Comprovante Não Fiscal formatado para impressora térmica de 80mm.
3. **Controle de Estoque & Entrada de Compras**:
   - Cadastro de produto com código de barras, estoque mínimo e preço de venda.
   - Registro de entrada de mercadorias com cálculo automático do **Preço Médio de Custo**.
   - Atualização opcional de preço de venda imediato na compra.
4. **Clientes & Limites de Crédito**:
   - Cadastro de clientes.
   - Integração com Crediário: exibe e altera o saldo devedor do cliente automaticamente ao realizar vendas a prazo ou receber pagamentos.
5. **Orçamentos & Condicionais**:
   - Geração de orçamentos (sem alteração de estoque) que podem ser finalizados (faturados) posteriormente no PDV.
   - Registro de saídas condicionais (ex: vestuário): decrementa e reserva os itens do estoque físico.
   - Módulo de devolução e fechamento de condicionais: o lojista seleciona a quantidade devolvida de cada produto e fatura automaticamente apenas as peças retidas.
6. **Financeiro**:
   - Lançamentos manuais de receitas e despesas no Livro Caixa.
   - Contas a Pagar e Contas a Receber com rotina de liquidação em um clique.
7. **Backup e Segurança**: Exportação e importação manual de todos os dados do sistema em arquivos JSON.

---

## 💻 Como Executar

O sistema foi feito utilizando apenas tecnologias nativas (HTML5, CSS3, JavaScript Modules), o que significa que **não requer compilação ou instalação de dependências**.

### Método 1: Servidor Local (Recomendado)
Para evitar restrições de CORS ao carregar arquivos JavaScript locais com a diretiva `import/export`, execute os arquivos através de um servidor local simples.

Se você tiver o Node.js instalado, pode rodar o comando na pasta do projeto:
```bash
npx live-server
```
Ou usando o Python:
```bash
python -m http.server 8082
```
Depois, acesse `http://localhost:8082` no seu navegador.

### Método 2: Abertura Direta
Em navegadores modernos, a abertura direta do arquivo `index.html` pode funcionar, mas se houver restrições de CORS em arquivos locais, utilize o Método 1.

---

## 📁 Estrutura de Arquivos

* `index.html` - Página única (SPA) contendo as seções de visualização e modais.
* `css/`
  * `main.css` - Paleta de cores, tipografia, sidebar e layout global.
  * `components.css` - Estilos para os modais, tabelas, PDV e cupom térmico.
* `js/`
  * `database.js` - Camada de banco de dados do LocalStorage com sementes (seed data).
  * `app.js` - Inicializador do sistema, roteador de abas, modais e relógio.
  * `dashboard.js` - Cálculo de indicadores e renderização do gráfico de fluxo.
  * `pdv.js` - Carrinho de vendas, leitura de código de barras e checkout.
  * `estoque.js` - Gestão de produtos, compras e cálculo de custo médio.
  * `clientes.js` - Cadastro de clientes e saldo do crediário.
  * `documentos.js` - Conversão de orçamentos e fluxo de condicional (devoluções/faturamento).
  * `financeiro.js` - Livro caixa, contas a pagar e contas a receber.
