import { pillars, roles, churchSizes, states } from './questions.ts';
import { score } from './scoring.ts';
export const CONSENT_VERSION = '2026-09-29-v1';
export function validateSubmission(input:unknown) {
 const b = input as Record<string,unknown>;
 if(!b || typeof b!=='object' || Array.isArray(b)) throw new Error('Dados inválidos.');
 const str=(obj:Record<string,unknown>,key:string,max:number,required=false)=>{
 const value=obj[key]; if(value===undefined && !required) return '';
 if(typeof value!=='string' || value.length>max || (required && !value.trim())) throw new Error('Campo inválido: '+key);
 return value.trim();
 };
 const token=str(b,'token',128,true);
 if(!/^[a-f0-9]{64}$/.test(token)) throw new Error('Sessão inválida.');
 const answers=b.answers as Record<string,boolean>; score(answers || {});
 const comments={} as Record<string,string>;
 if(!b.comments || typeof b.comments!=='object' || Array.isArray(b.comments)) throw new Error('Comentários inválidos.');
 for(const p of pillars) comments[p.id]=str(b.comments as Record<string,unknown>,p.id,2000);
 const c=b.contact as Record<string,unknown>;
 if(!c || typeof c!=='object' || Array.isArray(c)) throw new Error('Cadastro inválido.');
 const name=str(c,'name',120,true), email=str(c,'email',254,true).toLowerCase();
 if(name.length<2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Confira seu nome e e-mail.');
 const whatsapp=str(c,'whatsapp',30);
 if(whatsapp && (!/^[+()\d\s-]+$/.test(whatsapp) || whatsapp.replace(/\D/g,'').length<10 || whatsapp.replace(/\D/g,'').length>15)) throw new Error('Confira o WhatsApp.');
 const role=str(c,'role',80,true), church_size=str(c,'church_size',80,true), state=str(c,'state',2,true), city=str(c,'city',120,true);
 if(!(roles as readonly string[]).includes(role) || !(churchSizes as readonly string[]).includes(church_size) || !states.includes(state)) throw new Error('Selecione função, tamanho e estado válidos.');
 if(c.privacy_consent!==true || typeof c.marketing_consent!=='boolean' || typeof c.whatsapp_consent!=='boolean') throw new Error('Confira os consentimentos.');
 if(c.whatsapp_consent && !whatsapp) throw new Error('Informe o WhatsApp para autorizar contato.');
 const attribution = {} as Record<string,string>;
 const a=(b.attribution && typeof b.attribution==='object') ? b.attribution as Record<string,unknown> : {};
 for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) attribution[key]=str(a,key,200);
 const referrer=str(a,'referrer',255);
 if(referrer){try{const u=new URL(referrer);if(!['http:','https:'].includes(u.protocol))throw 0; attribution.referrer=u.origin;}catch{throw new Error('Origem inválida.');}}else attribution.referrer='';
 if(str(b,'website',200)) throw new Error('Não foi possível validar o envio.');
 return {token,answers,comments,contact:{name,email,whatsapp,role,city,state,church_size,privacy_consent:true,marketing_consent:c.marketing_consent,whatsapp_consent:c.whatsapp_consent},attribution,challenge_90_days:str(b,'challenge_90_days',3000,true),consent_version:CONSENT_VERSION};
}
