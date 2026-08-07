import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Listar clientes
router.get('/', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user as any;
    const customers = await prisma.customer.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
});

// Criar cliente
router.post('/', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user as any;
    const { name, email, phone, document } = req.body;
    
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        document,
        companyId
      }
    });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// Deletar cliente
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user as any;
    const { id } = req.params;
    
    await prisma.customer.delete({
      where: { id, companyId }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

export default router;
