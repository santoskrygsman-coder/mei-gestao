import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de dados...');

  // 1. Limpar banco de dados (Cuidado: isso apaga tudo!)
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // 2. Criar Empresa
  const company = await prisma.company.create({
    data: {
      name: 'Empresa Teste MEI',
      plan: 'pro'
    }
  });

  // 3. Criar Usuário Admin
  const hashedPassword = await bcrypt.hash('123456', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@meigestao.com.br',
      password: hashedPassword,
      role: 'ADMIN',
      companyId: company.id
    }
  });

  // 4. Criar Clientes
  const customers = [];
  const customerNames = ['João Silva', 'Maria Fernanda', 'Carlos Eduardo', 'Ana Beatriz', 'Pedro Paulo'];
  for (let i = 0; i < 5; i++) {
    const cust = await prisma.customer.create({
      data: {
        name: customerNames[i],
        email: `cliente${i}@email.com`,
        phone: `1199999000${i}`,
        companyId: company.id
      }
    });
    customers.push(cust);
  }

  // 5. Criar Produtos
  const products = [];
  const prodData = [
    { name: 'Capa iPhone 13', price: 45.0, cost: 15.0 },
    { name: 'Película de Vidro', price: 20.0, cost: 5.0 },
    { name: 'Carregador Turbo', price: 85.0, cost: 30.0 },
    { name: 'Cabo USB-C', price: 25.0, cost: 8.0 },
    { name: 'Fone Bluetooth', price: 120.0, cost: 50.0 },
    { name: 'Suporte Veicular', price: 35.0, cost: 12.0 },
    { name: 'Ring Light Pequena', price: 60.0, cost: 25.0 },
    { name: 'Capa Samsung S23', price: 50.0, cost: 18.0 },
    { name: 'Adaptador P2', price: 15.0, cost: 4.0 },
    { name: 'Pop Socket', price: 10.0, cost: 2.0 },
  ];

  for (let i = 0; i < prodData.length; i++) {
    const p = await prisma.product.create({
      data: {
        name: prodData[i].name,
        barcode: `7891000${i}000`,
        salePrice: prodData[i].price,
        costPrice: prodData[i].cost,
        stock: Math.floor(Math.random() * 50) + 10,
        companyId: company.id
      }
    });
    products.push(p);
  }

  // 6. Gerar Histórico de Transações e Vendas (Últimos 30 dias)
  const now = new Date();
  const categories = ['Fornecedores', 'Impostos', 'Marketing', 'Água/Luz', 'Internet', 'Aluguel'];
  
  // Criar 15 despesas
  for (let i = 0; i < 15; i++) {
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - Math.floor(Math.random() * 30));
    
    await prisma.transaction.create({
      data: {
        type: 'expense',
        description: `Pagamento ${categories[i % categories.length]}`,
        amount: Math.floor(Math.random() * 300) + 50,
        date: pastDate,
        category: categories[i % categories.length],
        companyId: company.id
      }
    });
  }

  // Criar 30 Vendas
  for (let i = 0; i < 30; i++) {
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - Math.floor(Math.random() * 30));
    
    // Pegar 1 a 3 produtos aleatórios
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let saleTotal = 0;
    
    for (let j = 0; j < numItems; j++) {
      const prod = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 2) + 1;
      items.push({
        productId: prod.id,
        quantity: qty,
        unitPrice: prod.salePrice,
        totalPrice: prod.salePrice * qty
      });
      saleTotal += prod.salePrice * qty;
    }

    const sale = await prisma.sale.create({
      data: {
        total: saleTotal,
        paymentMethod: ['CASH', 'PIX', 'CREDIT', 'DEBIT'][Math.floor(Math.random() * 4)],
        createdAt: pastDate,
        customerId: customers[Math.floor(Math.random() * customers.length)].id,
        companyId: company.id,
        items: {
          create: items
        }
      }
    });

    // Criar a transação de entrada associada à venda
    await prisma.transaction.create({
      data: {
        type: 'income',
        description: `Venda PDV #${sale.id.slice(0,6).toUpperCase()}`,
        amount: saleTotal,
        date: pastDate,
        category: 'Vendas PDV',
        companyId: company.id
      }
    });
  }

  console.log('Seed concluído com sucesso!');
  console.log(`Email de acesso: admin@meigestao.com.br`);
  console.log(`Senha de acesso: 123456`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
