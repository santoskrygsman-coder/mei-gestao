import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  // Forma comum: Bearer <token>
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_fallback') as any;
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
};
