import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import productRoutes from './routes/products';
import customerRoutes from './routes/customers';
import salesRouter from './routes/sales';
import reportsRouter from './routes/reports';
import uploadRouter from './routes/upload';
import billingRouter from './routes/billing';
import categoriesRouter from './routes/categories';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos (Uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', salesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/billing', billingRouter);
app.use('/api/categories', categoriesRouter);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]:', err.message || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`SaaS Backend running on http://localhost:${PORT}`);
});
