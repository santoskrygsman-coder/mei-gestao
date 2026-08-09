import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Get Categories
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const type = req.query.type as string | undefined; // 'PRODUCT' or 'TRANSACTION'
  
  try {
    const categories = await prisma.category.findMany({
      where: {
        companyId,
        ...(type ? { type: String(type) } : {})
      },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create Category
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { name, type, color } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }

  try {
    const category = await prisma.category.create({
      data: {
        name,
        type,
        color,
        companyId
      }
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update Category
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const id = req.params.id as string;
  const { name, type, color } = req.body;

  try {
    const category = await prisma.category.findFirst({
      where: { id, companyId }
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name, type, color }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete Category
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const id = req.params.id as string;

  try {
    const category = await prisma.category.findFirst({
      where: { id, companyId }
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await prisma.category.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
