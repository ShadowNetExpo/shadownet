const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors({ origin: ['https://shadownet-xi.vercel.app', 'https://shadownet-live.netlify.app', 'http://localhost:3000'] }));
app.use(express.json());

const sb = createClient(
  process.env.SUPABASE_URL || 'https://cdokplvoqivducsqrejt.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

// Paquetes de Almas
const PACKS = {
  p1: { skulls: 100,  bonus: 0,   price: 99,   name: '100 Almas' },
  p2: { skulls: 500,  bonus: 50,  price: 499,  name: '500 Almas' },
  p3: { skulls: 1200, bonus: 200, price: 999,  name: '1200 Almas' },
  p4: { skulls: 2600, bonus: 600, price: 1999, name: '2600 Almas' },
};

// POST /api/pay - Crear Payment Intent
app.post('/api/pay', async (req, res) => {
  try {
    const { packId, userId } = req.body;
    const pack = PACKS[packId];
    if (!pack) return res.status(400).json({ error: 'Paquete inválido' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pack.price,
      currency: 'usd',
      metadata: { packId, userId, skulls: pack.skulls + pack.bonus }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/webhook - Stripe confirma el pago
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const { userId, skulls } = pi.metadata;

    // Acreditar Almas al usuario en Supabase
    await sb.rpc('add_coins', { user_id: userId, amount: parseInt(skulls) });
    
    console.log(`✅ Pago confirmado: ${skulls} Almas → usuario ${userId}`);
  }

  res.json({ received: true });
});

// GET /api/health
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SHADOWNET Backend en puerto ${PORT}`));
