// SHADOWNET - Stripe Webhook Handler
// Usa Node.js crypto nativo y Supabase REST API
import crypto from 'crypto';

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifySig(payload, header, secret) {
  if (!header || !secret) return false;
  const tMatch = header.match(/t=(\d+)/);
  const vMatch = header.match(/v1=([a-f0-9]+)/);
  if (!tMatch || !vMatch) return false;
  const t = tMatch[1];
  const v = vMatch[1];
  const expected = crypto.createHmac('sha256', secret)
    .update(t + '.' + payload).digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(v, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch (e) {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (e) {
    return res.status(400).send('Error reading body');
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).send('Missing stripe-signature header');
  }

  if (!verifySig(rawBody.toString(), sig, process.env.STRIPE_WEBHOOK_SECRET)) {
    return res.status(400).send('Invalid signature');
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch (e) {
    return res.status(400).send('Invalid JSON');
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const userId = pi.metadata?.userId;
    const skulls = pi.metadata?.skulls;
    const packId = pi.metadata?.packId;

    if (userId && skulls) {
      const SK = process.env.SUPABASE_SERVICE_KEY;
      const BASE = 'https://cdokplvoqivducsqrejt.supabase.co';
      const HEADERS = {
        'apikey': SK,
        'Authorization': 'Bearer ' + SK,
        'Content-Type': 'application/json'
      };

      try {
        // Acreditar Almas en Supabase
        await fetch(BASE + '/rest/v1/rpc/add_coins', {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify({ user_id: userId, amount: parseInt(skulls) })
        });

        // Registrar transaccion
        await fetch(BASE + '/rest/v1/transactions', {
          method: 'POST',
          headers: { ...HEADERS, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            user_id: userId,
            type: 'purchase',
            amount: parseInt(skulls),
            pack_id: packId || null,
            stripe_payment_intent: pi.id
          })
        });

        console.log('Almas acreditadas:', skulls, 'usuario:', userId);
      } catch (e) {
        console.error('Error acreditando:', e.message);
      }
    }
  }

  res.status(200).json({ received: true });
}
