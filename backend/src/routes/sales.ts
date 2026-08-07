import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Listar Vendas (Histórico do PDV)
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const { companyId } = req.user as any;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    } : {};

    const sales = await prisma.sale.findMany({
      where: { companyId, ...dateFilter },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(sales);
  } catch (error) {
    next(error);
  }
});

// Registrar Nova Venda ou Condicional (PDV)
router.post('/', async (req: Request, res: Response) => {
  const { companyId } = req.user as any;
  const { total, paymentMethod, customerId, items, status = 'COMPLETED' } = req.body;

  try {
    // Usamos transação do prisma para garantir que tudo salva junto ou falha junto
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar a Venda
      const sale = await tx.sale.create({
        data: {
          total: Number(total),
          status,
          paymentMethod,
          customerId: customerId || null,
          companyId,
          items: {
            create: items.map((item: any) => ({
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              totalPrice: item.quantity * Number(item.unitPrice),
              productId: item.productId
            }))
          }
        },
        include: { items: true }
      });

      // 2. Dar baixa no estoque de cada produto
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // 3. Registrar a Transação Financeira no Fluxo de Caixa (Dashboard)
      // 3. Registrar a Transação Financeira no Fluxo de Caixa apenas se estiver concluída
      if (status === 'COMPLETED') {
        await tx.transaction.create({
          data: {
            type: 'income',
            description: `Venda PDV - #${sale.id.slice(-6)}`,
            amount: Number(total),
            category: 'Vendas',
            date: new Date().toISOString(),
            companyId
          }
        });
      }

      return sale;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar venda no PDV' });
  }
});

// Finalizar uma Condicional
router.post('/:id/finalize', async (req: Request, res: Response) => {
  const { companyId } = req.user as any;
  const id = req.params.id as string;
  const { paymentMethod } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({ where: { id, companyId } });
      if (!sale || sale.status !== 'CONDICIONAL') {
        throw new Error('Condicional não encontrada ou já finalizada');
      }

      const updatedSale = await tx.sale.update({
        where: { id },
        data: { status: 'COMPLETED', paymentMethod }
      });

      await tx.transaction.create({
        data: {
          type: 'income',
          description: `Venda PDV (Condicional Finalizada) - #${sale.id.slice(-6)}`,
          amount: sale.total,
          category: 'Vendas',
          date: new Date().toISOString(),
          companyId
        }
      });

      return updatedSale;
    });

    res.json(result);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Erro ao finalizar condicional' });
  }
});

// Devolver/Cancelar uma Condicional
router.post('/:id/return', async (req: Request, res: Response) => {
  const { companyId } = req.user as any;
  const id = req.params.id as string;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({ 
        where: { id, companyId },
        include: { items: true }
      });
      if (!sale || sale.status !== 'CONDICIONAL') {
        throw new Error('Condicional não encontrada ou não pode ser devolvida');
      }

      const updatedSale = await tx.sale.update({
        where: { id },
        data: { status: 'RETURNED' }
      });

      // Devolve itens pro estoque
      const itemsToReturn = (sale as any).items || [];
      for (const item of itemsToReturn) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
      }

      return updatedSale;
    });

    res.json(result);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Erro ao devolver condicional' });
  }
});

export default router;
