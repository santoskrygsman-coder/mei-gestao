import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Listar Vendas (Histórico do PDV)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user as any;
    const sales = await prisma.sale.findMany({
      where: { companyId },
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
    res.status(500).json({ error: 'Erro ao listar vendas' });
  }
});

// Registrar Nova Venda (PDV)
router.post('/', async (req: Request, res: Response) => {
  const { companyId } = req.user as any;
  const { total, paymentMethod, customerId, items } = req.body;

  try {
    // Usamos transação do prisma para garantir que tudo salva junto ou falha junto
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar a Venda
      const sale = await tx.sale.create({
        data: {
          total: Number(total),
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

      return sale;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar venda no PDV' });
  }
});

export default router;
