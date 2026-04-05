// SHADOWNET - Stripe Webhook - proxies to Supabase Edge Function
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const rawBody = await new Promise((resolve,reject)=>{
      const chunks=[];
      req.on('data',c=>chunks.push(c));
      req.on('end',()=>resolve(Buffer.concat(chunks).toString()));
      req.on('error',reject);
    });
    // Proxy to Supabase Edge Function
    const r = await fetch('https://cdokplvoqivducsqrejt.supabase.co/functions/v1/stripe-payment/webhook',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'stripe-signature': req.headers['stripe-signature']||''
      },
      body: rawBody
    });
    const data = await r.json();
    res.status(r.status).json(data);
  }catch(err){
    res.status(500).json({error:err.message});
  }
}
export const config = { api: { bodyParser: false } };
