import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // 1. Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'E-mail já cadastrado.' });
    }

    // 2. Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Criar Company e User na mesma transação
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: `Empresa de ${name}` }
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          companyId: company.id,
          role: 'ADMIN'
        }
      });

      return { user, company };
    });

    res.status(201).json({ 
      message: 'Conta criada com sucesso!',
      companyId: result.company.id
    });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ error: 'Erro interno ao criar conta.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { userId: user.id, companyId: user.companyId, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { name: user.name, email: user.email, companyId: user.companyId } });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Erro interno ao fazer login.' });
  }
});

export default router;
