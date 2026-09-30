import { createClient } from '@supabase/supabase-js';
export const demoMode=import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE==='true';
const url=import.meta.env.VITE_SUPABASE_URL || '';
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
export const configured=Boolean(url && key);
export const supabase=configured?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storage:sessionStorage,storageKey:'revitalize:admin'}}):null;
export const privacyUrl=validHttps(import.meta.env.VITE_PRIVACY_POLICY_URL);
export function validHttps(value:unknown):string {try{const u=new URL(String(value||''));return u.protocol==='https:'?u.href:'';}catch{return '';}}
export async function publicRequest(action:string,payload:Record<string,unknown>={}):Promise<any>{
 if(!configured)throw new Error('O diagnóstico ainda não está disponível para envio. Tente novamente mais tarde.');
 const response=await fetch(url+'/functions/v1/diagnostic',{method:'POST',headers:{'Content-Type':'application/json',apikey:key},body:JSON.stringify({action,...payload}),signal:AbortSignal.timeout(25000)});
 const data=await response.json();
 if(!response.ok)throw Object.assign(new Error(data.error || 'Não foi possível concluir. Suas respostas estão preservadas.'),{status:response.status});
 return data;
}
