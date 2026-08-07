import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Proteger todas as rotas de transações
router.use(authenticateToken);

// Listar Transações
router.get('/', async (req, res) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(403).json({ error: 'Company ID não encontrado no token' });
    }

    const transactions = await prisma.transaction.findMany({
      where: { companyId },
      orderBy: { date: 'desc' }
    });

    res.json(transactions);
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    res.status(500).json({ error: 'Erro interno ao buscar transações' });
  }
});

// Criar Transação
router.post('/', async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { type, description, amount, date, category } = req.body;

    if (!companyId) {
      return res.status(403).json({ error: 'Company ID não encontrado' });
    }

    if (!type || !description || amount === undefined || !date) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        type, // 'income' ou 'expense'
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        category: category || 'Geral',
        companyId
      }
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    res.status(500).json({ error: 'Erro interno ao criar transação' });
  }
});

// Excluir Transação
router.delete('/:id', async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const transactionId = req.params.id;

    // Verificar se a transação pertence a essa empresa
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction || transaction.companyId !== companyId) {
      return res.status(404).json({ error: 'Transação não encontrada ou acesso negado' });
    }

    await prisma.transaction.delete({
      where: { id: transactionId }
    });

    res.json({ message: 'Transação excluída com sucesso' });
  } catch (error) {
    console.error("Erro ao excluir transação:", error);
    res.status(500).json({ error: 'Erro interno ao excluir transação' });
  }
});

export default router;
