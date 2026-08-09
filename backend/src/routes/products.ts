import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Listar produtos
router.get('/', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user as any;
    const search = req.query.search as string;
    const products = await prisma.product.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

// Criar produto
router.post('/', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user as any;
    const { name, barcode, costPrice, salePrice, stock, minStock, category, description, imageUrl } = req.body;
    
    const product = await prisma.product.create({
      data: {
        name,
        barcode,
        costPrice: Number(costPrice) || 0,
        salePrice: Number(salePrice),
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 5,
        category,
        description,
        imageUrl,
        companyId
      }
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Deletar produto
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user as any;
    const id = req.params.id as string;
    
    await prisma.product.delete({
      where: { id, companyId }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

// Editar produto
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user as any;
    const id = req.params.id as string;
    const { name, barcode, costPrice, salePrice, stock, minStock, category, description, imageUrl } = req.body;
    
    const product = await prisma.product.update({
      where: { id, companyId },
      data: {
        name,
        barcode,
        costPrice: Number(costPrice) || 0,
        salePrice: Number(salePrice),
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 5,
        category,
        description,
        imageUrl
      }
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Adicionar Estoque
router.patch('/:id/stock', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user as any;
    const id = req.params.id as string;
    const { amount } = req.body;
    
    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Quantidade inválida' });
    }

    const product = await prisma.product.update({
      where: { id, companyId },
      data: {
        stock: {
          increment: Number(amount)
        }
      }
    });
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar estoque' });
  }
});

export default router;
