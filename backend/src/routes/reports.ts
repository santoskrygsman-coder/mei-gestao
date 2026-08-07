import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// 1. Produtos Mais Vendidos
router.get('/top-products', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user as any;
    
    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          companyId
        }
      },
      include: {
        product: true
      }
    });

    // Aggregate by product
    const productSales: Record<string, { product: any, quantity: number, revenue: number }> = {};
    
    for (const item of saleItems) {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          product: item.product,
          quantity: 0,
          revenue: 0
        };
      }
      productSales[item.productId].quantity += item.quantity;
      productSales[item.productId].revenue += item.totalPrice;
    }

    const result = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar relatório de produtos' });
  }
});

// 2. Melhores Clientes
router.get('/top-customers', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user as any;
    
    const sales = await prisma.sale.findMany({
      where: { companyId, customerId: { not: null } },
      include: { customer: true }
    });

    const customerSales: Record<string, { customer: any, totalSpent: number, totalPurchases: number }> = {};

    for (const sale of sales) {
      if (!sale.customerId) continue;
      if (!customerSales[sale.customerId]) {
        customerSales[sale.customerId] = {
          customer: sale.customer,
          totalSpent: 0,
          totalPurchases: 0
        };
      }
      customerSales[sale.customerId].totalSpent += sale.total;
      customerSales[sale.customerId].totalPurchases += 1;
    }

    const result = Object.values(customerSales).sort((a, b) => b.totalSpent - a.totalSpent);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar relatório de clientes' });
  }
});

// 3. Resumo Financeiro
router.get('/financial', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user as any;
    
    const transactions = await prisma.transaction.findMany({
      where: { companyId }
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown: Record<string, number> = {};

    for (const t of transactions) {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
        const cat = t.category || 'Outros';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + t.amount;
      }
    }

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      expensesByCategory: Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar resumo financeiro' });
  }
});

export default router;
