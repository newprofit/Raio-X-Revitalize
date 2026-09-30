import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { validateSubmission } from '../../../shared/validation.ts';
const env=(key:string)=>Deno.env.get(key)||'';
const origins=env('ALLOWED_ORIGINS').split(',').map(s=>s.trim()).filter(Boolean);
const db=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
const hex=(a:ArrayBuffer)=>Array.from(new Uint8Array(a)).map(v=>v.toString(16).padStart(2,'0')).join('');
const sha=async(s:string)=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
async function rateKey(ip:string){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env('RATE_LIMIT_SALT')),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(ip+':'+new Date().toISOString().slice(0,13))));
}
async function body(req:Request){
 if(!req.headers.get('content-type')?.includes('application/json'))throw new Error('invalid_body');
 const reader=req.body?.getReader();if(!reader)throw new Error('invalid_body');
 let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();throw new Error('invalid_body');}chunks.push(value);}
 const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}
 return JSON.parse(new TextDecoder().decode(all));
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';
 const cors:Record<string,string>={'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'content-type, apikey, authorization, x-client-info','Cache-Control':'no-store'};
 if(origins.includes(origin))cors['Access-Control-Allow-Origin']=origin;
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
 if(!origins.includes(origin))return reply({error:'Origem não autorizada.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return reply({error:'Método não permitido.'},405);
 try{
 if(!env('RATE_LIMIT_SALT') || !env('TURNSTILE_SECRET_KEY') || !env('TURNSTILE_HOSTNAMES') || !env('PRIVACY_POLICY_URL').startsWith('https://'))return reply({error:'O diagnóstico está em configuração. Tente novamente mais tarde.'},503);
 const header=env('TRUSTED_IP_HEADER')||'x-forwarded-for';
 // O gateway deve sobrescrever ou acrescentar o IP real. Validar na hospedagem.
 const ip=(req.headers.get(header)||'').split(',').at(-1)?.trim();
 if(!ip)return reply({error:'Não foi possível validar a conexão.'},503);
 const b=await body(req);
 if(!b || !['start','submit'].includes(b.action))return reply({error:'Solicitação inválida.'},400);
 const {data:allowed,error:rateError}=await db.rpc('consume_rate_limit',{p_bucket:b.action+':'+await rateKey(ip),p_max:b.action==='start'?30:15,p_seconds:3600});
 if(rateError)return reply({error:'Serviço temporariamente indisponível.'},503);
 if(!allowed)return reply({error:'Muitas tentativas. Aguarde antes de tentar novamente.'},429);
 if(b.action==='start'){
 const token=hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
 const {data,error}=await db.from('quiz_sessions').insert({token_hash:await sha(token)}).select('started_at').single();
 if(error)return reply({error:'Não foi possível iniciar. Tente novamente.'},503);
 return reply({token,started_at:data.started_at});
 }
 let validated;
 try{validated=validateSubmission(b);}catch(err){return reply({error:(err as Error).message},400);}
 if(typeof b.turnstile_token!=='string' || b.turnstile_token.length>2048 || !b.turnstile_token)return reply({error:'Conclua a verificação de segurança.'},400);
 const verified=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env('TURNSTILE_SECRET_KEY'),response:b.turnstile_token,remoteip:ip}),signal:AbortSignal.timeout(10000)});
 if(!verified.ok)return reply({error:'Verificação indisponível. Tente novamente.'},503);
 const captcha=await verified.json();
 const hostnames=env('TURNSTILE_HOSTNAMES').split(',').map(v=>v.trim());
 if(captcha.success!==true || captcha.action!=='diagnostic' || !hostnames.includes(captcha.hostname))return reply({error:'Verificação expirada ou inválida. Tente novamente.'},400);
 const {token,...payload}=validated;
 const {data,error}=await db.rpc('complete_diagnostic',{p_token_hash:await sha(token),p_payload:payload,p_policy_url:env('PRIVACY_POLICY_URL')});
 if(error){
 if(error.message.includes('expired_session') || error.message.includes('invalid_session'))return reply({error:'Sua sessão expirou. Volte ao início e continue o diagnóstico para renovar o acesso. Suas respostas estão preservadas.'},409);
 return reply({error:'Não foi possível salvar. Suas respostas estão preservadas; tente novamente.'},503);
 }
 return reply({result:data});
 }catch{
 // Nunca registrar corpo, IP, contato, respostas, token ou erro do banco.
 return reply({error:'Não foi possível processar o envio. Confira sua conexão e tente novamente.'},400);
 }
});
