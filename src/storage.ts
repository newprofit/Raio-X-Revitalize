import { pillars } from '../shared/questions.ts';
export type Draft = {version:1; updatedAt:number; startedAt:string; step:number; answers:Record<string,boolean>; comments:Record<string,string>; challenge:string; token?:string; trackedPillars:string[]};
const KEY='revitalize:draft:v1'; const TTL=7*24*60*60*1000;
export function newDraft():Draft {return {version:1,updatedAt:Date.now(),startedAt:new Date().toISOString(),step:0,answers:{},comments:{},challenge:'',trackedPillars:[]};}
export function saveDraft(d:Draft):boolean {try{d.updatedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(d));return true;}catch{return false;}}
export function clearDraft(){try{localStorage.removeItem(KEY);}catch{/* Storage indisponível. */}}
export function restoreDraft():Draft|null {
 try {const d=JSON.parse(localStorage.getItem(KEY)||'null');
 if(!d || d.version!==1 || !Number.isFinite(d.updatedAt) || Date.now()-d.updatedAt>TTL || !Number.isInteger(d.step) || d.step<0 || d.step>7 || !d.answers || typeof d.answers!=='object' || !d.comments || typeof d.comments!=='object' || typeof d.challenge!=='string' || d.challenge.length>3000) {clearDraft();return null;}
 if(Object.entries(d.answers).some(([k,v])=>!/^([1-9]|1[0-8])$/.test(k) || typeof v!=='boolean')) {clearDraft();return null;}
 if(Object.entries(d.comments).some(([k,v])=>!pillars.some(p=>p.id===k) || typeof v!=='string' || v.length>2000)) {clearDraft();return null;}
 if(d.token && !/^[a-f0-9]{64}$/.test(d.token)){clearDraft();return null;}
 d.trackedPillars=Array.isArray(d.trackedPillars)?d.trackedPillars.filter((x:unknown)=>typeof x==='string'):[];
 const firstIncomplete=pillars.findIndex((_,i)=>[1,2,3].some(j=>typeof d.answers[String(i*3+j)]!=='boolean'));
 d.step=Math.min(d.step,firstIncomplete<0?(d.challenge.trim()?7:6):firstIncomplete);
 return d;
 }catch{clearDraft();return null;}
}
export function attribution():Record<string,string> {
 const key='revitalize:attribution:v1';
 try {const old=sessionStorage.getItem(key);if(old)return JSON.parse(old);}catch{/* memória */ }
 const params=new URLSearchParams(location.search); const data:Record<string,string>={};
 for(const k of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'])data[k]=(params.get(k)||'').slice(0,200);
 try{data.referrer=document.referrer?new URL(document.referrer).origin:'';}catch{data.referrer='';}
 try{sessionStorage.setItem(key,JSON.stringify(data));}catch{/* Não impede o fluxo. */}
 return data;
}
