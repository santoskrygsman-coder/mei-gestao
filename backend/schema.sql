-- schema.sql
-- Script de criação do banco de dados PostgreSQL para MEI Fácil Gestão

-- Tabela de Empresas (Multi-tenant)
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    phone VARCHAR(20),
    address TEXT,
    markup NUMERIC(5,2) DEFAULT 30.00,
    wa_mode VARCHAR(20) DEFAULT 'link',
    wa_endpoint TEXT,
    wa_token TEXT,
    logo_base64 TEXT,
    footer_message TEXT DEFAULT 'Obrigado pela preferência!'
);

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'vendedor' -- 'admin' ou 'vendedor'
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) NOT NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    barcode VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    cost NUMERIC(10,2) DEFAULT 0.00,
    price NUMERIC(10,2) DEFAULT 0.00,
    stock NUMERIC(10,2) DEFAULT 0.00,
    min_stock NUMERIC(10,2) DEFAULT 0.00,
    PRIMARY KEY (id, company_id)
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(50) NOT NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    doc VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(100),
    balance NUMERIC(10,2) DEFAULT 0.00,
    PRIMARY KEY (id, company_id)
);

-- Tabela de Documentos (Vendas, Orçamentos, Condicionais)
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(50) NOT NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'venda', 'orcamento', 'condicional'
    client_id VARCHAR(50),
    client_name VARCHAR(255),
    date DATE NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0.00,
    addition NUMERIC(10,2) DEFAULT 0.00,
    total NUMERIC(10,2) DEFAULT 0.00,
    credit_used NUMERIC(10,2) DEFAULT 0.00,
    remaining NUMERIC(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'finalizado', -- 'finalizado', 'aberto', 'cancelada'
    payment_method VARCHAR(50),
    due_date DATE,
    PRIMARY KEY (id, company_id)
);

-- Tabela de Itens de Documentos
CREATE TABLE IF NOT EXISTS document_items (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL,
    company_id INTEGER NOT NULL,
    product_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    qty NUMERIC(10,2) NOT NULL,
    FOREIGN KEY (document_id, company_id) REFERENCES documents(id, company_id) ON DELETE CASCADE
);

-- Tabela de Transações (Livro Caixa)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL, -- 'receita' ou 'despesa'
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL
);

-- Tabela de Contas a Pagar / Receber
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL, -- 'pagar' ou 'receber'
    description VARCHAR(255) NOT NULL,
    client_id VARCHAR(50),
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente' -- 'pendente' ou 'pago'
);

-- Inserção de dados padrão de teste da primeira empresa
INSERT INTO companies (id, name, cnpj, phone, address, markup)
VALUES (1, 'Mercadinho do Bairro', '12.345.678/0001-90', '(11) 98765-4321', 'Rua das Flores, 123', 30.00)
ON CONFLICT DO NOTHING;

-- Senha padrão criptografada correspondente a 'admin' e 'caixa' (usaremos bcrypt)
-- admin: $2a$10$8nd5drp/dWY1Csc6SlyfD.F9zh3YFbFvgAue3IWwYZlDOsbU.cyBS (hash do bcrypt para 'admin')
-- caixa: $2a$10$tMNpI0JI1Fgxg1bnRIXZkucsGGhYsql7RjzD4yWqmcgD7X2aMEHFm (hash do bcrypt para 'caixa')
INSERT INTO users (company_id, name, username, password, role)
VALUES 
(1, 'Administrador Principal', 'admin', '$2a$10$8nd5drp/dWY1Csc6SlyfD.F9zh3YFbFvgAue3IWwYZlDOsbU.cyBS', 'admin'),
(1, 'Caixa Operador', 'caixa', '$2a$10$tMNpI0JI1Fgxg1bnRIXZkucsGGhYsql7RjzD4yWqmcgD7X2aMEHFm', 'vendedor')
ON CONFLICT DO NOTHING;
