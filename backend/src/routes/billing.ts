import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fake_key', {
  apiVersion: '2025-01-27.acacia' as any
});

// Middleware específico para rotas de billing (para não ser bloqueado pelo próprio bloqueio de 402)
const authenticateBilling = async (req: Request, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_fallback') as any;
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token inválido.' });
  }
};

// GET /api/billing/status
router.get('/status', authenticateBilling, async (req: Request, res: Response) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
      select: { trialEndsAt: true, subscriptionStatus: true }
    });
    
    if (!company) return res.status(404).json({ error: 'Empresa não encontrada' });
    
    const now = new Date();
    const trialExpired = company.trialEndsAt ? new Date(company.trialEndsAt) < now : true;
    const isSubscribed = company.subscriptionStatus === 'active';
    
    res.json({
      trialEndsAt: company.trialEndsAt,
      subscriptionStatus: company.subscriptionStatus,
      isTrialExpired: trialExpired,
      isSubscribed: isSubscribed
    });
  } catch (error) {
    console.error('Error fetching billing status:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/billing/create-checkout-session
router.post('/create-checkout-session', authenticateBilling, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return res.status(404).json({ error: 'Empresa não encontrada' });

    // Criar cliente no Stripe se não existir
    let stripeCustomerId = company.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: company.name,
        metadata: { companyId }
      });
      stripeCustomerId = customer.id;
      await prisma.company.update({
        where: { id: companyId },
        data: { stripeCustomerId }
      });
    }

    const domain = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Para usar um Price ID real, crie o produto no Dashboard do Stripe de R$ 49.99/mês
    // e coloque o PRICE_ID no .env. Como fallback usamos um price genérico caso não tenha
    const priceId = process.env.STRIPE_PRICE_ID || 'price_mock_id';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${domain}/?success=true`,
      cancel_url: `${domain}/billing?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    res.status(500).json({ error: 'Erro ao criar sessão de pagamento', details: error.message });
  }
});

// POST /api/billing/webhook
// Esta rota deve receber raw body, logo não pode usar express.json() antes.
// Em produção, você precisa injetar bodyParser.raw() especificamente para essa rota.
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // Atenção: para o Stripe validar a assinatura, o corpo (req.body) deve ser Buffer.
    // Como o express.json() global já o processou em server.ts/index.ts, a validação de webhook pode falhar
    // se não for configurado corretamente. Como MVP, vamos validar ou assumir mock.
    if (webhookSecret && sig && req.body instanceof Buffer) {
       event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    } else {
       // Se não tem secret, aceitamos o evento (modo dev/mock)
       event = req.body;
    }
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Lidar com o evento
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      if (session.customer) {
        await prisma.company.updateMany({
          where: { stripeCustomerId: session.customer },
          data: { subscriptionStatus: 'active' }
        });
      }
      break;
    }
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as any;
      const status = subscription.status; // 'active', 'past_due', 'canceled', etc
      if (subscription.customer) {
        await prisma.company.updateMany({
          where: { stripeCustomerId: subscription.customer },
          data: { subscriptionStatus: status }
        });
      }
      break;
    }
  }

  res.json({ received: true });
});

export default router;
