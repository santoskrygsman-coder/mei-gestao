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
    const search = req.query.search as string;
    const customers = await prisma.customer.findMany({
      where: { 
        companyId,
        ...(search && {
          name: { contains: search, mode: 'insensitive' }
        })
      },
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
    const { 
      name, email, phone, document,
      cep, address, number, complement, neighborhood, city, state, notes, creditLimit
    } = req.body;
    
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        document,
        cep,
        address,
        number,
        complement,
        neighborhood,
        city,
        state,
        notes,
        creditLimit: creditLimit ? Number(creditLimit) : 0,
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
    const id = req.params.id as string;
    
    await prisma.customer.delete({
      where: { id, companyId }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

// Atualizar cliente
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user as any;
    const id = req.params.id as string;
    const { 
      name, email, phone, document,
      cep, address, number, complement, neighborhood, city, state, notes, creditLimit
    } = req.body;
    
    const customer = await prisma.customer.update({
      where: { id, companyId },
      data: {
        name,
        email,
        phone,
        document,
        cep,
        address,
        number,
        complement,
        neighborhood,
        city,
        state,
        notes,
        creditLimit: creditLimit !== undefined ? Number(creditLimit) : undefined
      }
    });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

// Buscar Conta/Notinhas do Cliente
router.get('/:id/account', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user as any;
    const customerId = req.params.id as string;
    
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const pendingSales = await prisma.sale.findMany({
      where: {
        customerId,
        companyId,
        status: 'PENDING_PAYMENT'
      },
      include: {
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const totalUsed = pendingSales.reduce((acc, sale) => acc + sale.total, 0);
    const availableCredit = Math.max(0, customer.creditLimit - totalUsed);

    res.json({
      creditLimit: customer.creditLimit,
      totalUsed,
      availableCredit,
      pendingSales
    });

  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar conta do cliente' });
  }
});

export default router;
