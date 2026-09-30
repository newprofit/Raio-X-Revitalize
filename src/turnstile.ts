declare global {interface Window {turnstile?:{render:(el:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void;reset:(id:string)=>void}}}
let loading:Promise<void>|null=null;
let widget:string|undefined;
export function destroyTurnstile(){if(widget){window.turnstile?.remove(widget);widget=undefined;}}
export function resetTurnstile(){if(widget)window.turnstile?.reset(widget);}
export async function mountTurnstile(el:HTMLElement,onToken:(token:string)=>void,onError:()=>void) {
 const sitekey=import.meta.env.VITE_TURNSTILE_SITE_KEY;
 if(!sitekey){onError();return;}
 try{
 if(!window.turnstile){
 loading??=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=()=>resolve();script.onerror=()=>reject(new Error('Turnstile indisponível'));document.head.append(script);});
 await loading;
 }
 if(!el.isConnected)return;
 widget=window.turnstile!.render(el,{sitekey,action:'diagnostic',callback:onToken,'expired-callback':()=>onToken(''),'error-callback':()=>{onToken('');onError();},language:'pt-br',theme:'light'});
 }catch{onError();}
}
