import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        companyId: string;
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_fallback') as any;
    req.user = verified;

    // Verificar status da assinatura
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
      select: { active: true, trialEndsAt: true, subscriptionStatus: true }
    });

    if (!company || !company.active) {
      return res.status(403).json({ error: 'Conta desativada.' });
    }

    const now = new Date();
    const trialExpired = company.trialEndsAt ? new Date(company.trialEndsAt) < now : true;
    const isSubscribed = company.subscriptionStatus === 'active';

    if (trialExpired && !isSubscribed) {
      return res.status(402).json({ error: 'Período de teste expirado. Assinatura necessária.', code: 'TRIAL_EXPIRED' });
    }

    next();
  } catch (err) {
    res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
};
