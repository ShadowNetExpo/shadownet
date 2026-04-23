// DEPRECATED: Stripe payment endpoint removed. SHADOWNET uses CCBill exclusively via Supabase edge function `ccbill-payment`.
// This file will be deleted in a future cleanup. Kept temporarily to avoid breaking Vercel build.
export default function handler(req, res) {
    res.status(410).json({ error: 'Gone. Stripe payments removed. Use /functions/v1/ccbill-payment instead.' });
}/ SHADOWNET - Payment Intent API - sin npm packages
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const PACKS={p1:{skulls:100,bonus:0,price:99},p2:{skulls:500,bonus:50,price:499},p3:{skulls:1200,bonus:200,price:999},p4:{skulls:2600,bonus:600,price:1999}};
  try{
    const {packId,userId}=req.body;
    const pack=PACKS[packId];
    if(!pack) return res.status(400).json({error:'Paquete invalido'});
    const skulls=pack.skulls+pack.bonus;
    const body=['amount='+pack.price,'currency=usd','automatic_payment_methods[enabled]=true','metadata[packId]='+encodeURIComponent(packId),'metadata[userId]='+encodeURIComponent(userId),'metadata[skulls]='+skulls].join('&');
    const sr=await fetch('https://api.stripe.com/v1/payment_intents',{method:'POST',headers:{'Authorization':'Bearer '+process.env.STRIPE_SECRET_KEY,'Content-Type':'application/x-www-form-urlencoded'},body:body});
    const data=await sr.json();
    if(data.error) return res.status(400).json({error:data.error.message});
    res.json({clientSecret:data.client_secret});
  }catch(err){
    res.status(500).json({error:err.message});
  }
}
