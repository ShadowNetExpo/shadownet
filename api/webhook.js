// SHADOWNET - Webhook Stripe - sin npm packages
// Usa crypto nativo de Node.js y Supabase REST API
import crypto from 'crypto';

export const config={api:{bodyParser:false}};

async function getRawBody(req){return new Promise((res,rej)=>{const c=[];req.on('data',ch=>c.push(ch));req.on('end',()=>res(Buffer.concat(c)));req.on('error',rej);});}

function verifySig(payload,header,secret){
  const t=(header.match(/t=(\d+)/)||[])[1];
  const v=(header.match(/v1=([a-f0-9]+)/)||[])[1];
  if(!t||!v) return false;
  const expected=crypto.createHmac('sha256',secret).update(t+'.'+payload).digest('hex');
  try{return crypto.timingSafeEqual(Buffer.from(v,'hex'),Buffer.from(expected,'hex'));}catch(e){return false;}
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const raw=await getRawBody(req);
  const sig=req.headers['stripe-signature'];
  if(!verifySig(raw.toString(),sig,process.env.STRIPE_WEBHOOK_SECRET)){
    return res.status(400).send('Invalid signature');
  }
  const event=JSON.parse(raw.toString());
  if(event.type==='payment_intent.succeeded'){
    const {userId,skulls,packId}=event.data.object.metadata;
    if(userId&&skulls){
      const S=process.env.SUPABASE_SERVICE_KEY;
      const B='https://cdokplvoqivducsqrejt.supabase.co';
      const H={'apikey':S,'Authorization':'Bearer '+S,'Content-Type':'application/json'};
      // Acreditar Almas
      await fetch(B+'/rest/v1/rpc/add_coins',{method:'POST',headers:H,body:JSON.stringify({user_id:userId,amount:parseInt(skulls)})});
      // Registrar transaccion
      await fetch(B+'/rest/v1/transactions',{method:'POST',headers:{...H,'Prefer':'return=minimal'},body:JSON.stringify({user_id:userId,type:'purchase',amount:parseInt(skulls),pack_id:packId||null,stripe_payment_intent:event.data.object.id})});
      console.log('Almas acreditadas:',skulls,'usuario:',userId);
    }
  }
  res.json({received:true});
}
