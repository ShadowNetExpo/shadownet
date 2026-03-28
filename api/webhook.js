import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const sb = createClient('https://cdokplvoqivducsqrejt.supabase.co', process.env.SUPABASE_SERVICE_KEY);

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook error:', err.message);
    return res.status(400).send('Webhook Error: ' + err.message);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const { userId, skulls, packId } = pi.metadata;
    if (userId && skulls) {
      const { error } = await sb.rpc('add_coins', { user_id: userId, amount: parseInt(skulls) });
      if (!error) {
        await sb.from('transactions').insert({
          user_id: userId,
          type: 'purchase',
          amount: parseInt(skulls),
          pack_id: packId || null,
          stripe_payment_intent: pi.id
        });
        console.log('Almas acreditadas:', skulls, 'usuario:', userId);
      } else {
        console.error('Error acreditando Almas:', error);
      }
    }
  }

  res.json({ received: true });
}
