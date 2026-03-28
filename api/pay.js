// SHADOWNET - Stripe Payment Intent API
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PACKS = {
  p1: { skulls: 100,  bonus: 0,   price: 99   },
  p2: { skulls: 500,  bonus: 50,  price: 499  },
  p3: { skulls: 1200, bonus: 200, price: 999  },
  p4: { skulls: 2600, bonus: 600, price: 1999 },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { packId, userId } = req.body;
    const pack = PACKS[packId];
    if (!pack) return res.status(400).json({ error: 'Paquete invalido' });

    const pi = await stripe.paymentIntents.create({
      amount: pack.price,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        packId,
        userId,
        skulls: String(pack.skulls + pack.bonus)
      }
    });

    res.json({ clientSecret: pi.client_secret });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: err.message });
  }
}
