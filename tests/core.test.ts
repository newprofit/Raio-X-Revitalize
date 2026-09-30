import test from 'node:test';
import assert from 'node:assert/strict';
import {score,summarize,levels} from '../shared/scoring.ts';
import {pillars} from '../shared/questions.ts';
import {validateSubmission} from '../shared/validation.ts';
import {csvCell} from '../src/csv.ts';
const yes=()=>Object.fromEntries(Array.from({length:18},(_,i)=>[String(i+1),true]));
export function validPayload(){
 return {token:'a'.repeat(64),answers:yes(),comments:Object.fromEntries(pillars.map(p=>[p.id,''])),contact:{name:'Teste automatizado',email:'teste@example.invalid',whatsapp:'',role:'Pastor titular',city:'Cidade de teste',state:'SP',church_size:'Até 50 pessoas',privacy_consent:true,marketing_consent:false,whatsapp_consent:false},attribution:{utm_source:'teste'},challenge_90_days:'Texto exclusivo de teste.',website:''};
}
test('níveis exatos e nenhuma prioridade quando todas as respostas são Sim',()=>{
 assert.deepEqual(levels,['Base consistente','Ponto de atenção','Atenção relevante','Prioridade']);
 const r=score(yes());assert.equal(Object.values(r.counts).reduce((a,b)=>a+b),0);assert.deepEqual(r.priority_pillars,[]);assert.deepEqual(r.secondary_pillars,[]);
});
test('4096 combinações de contagens preservam todos os empates e secundários',()=>{
 for(let n=0;n<4096;n++){
 let value=n;const answers=yes();const counts:Record<string,number>={};
 pillars.forEach((p,i)=>{counts[p.id]=value%4;value=Math.floor(value/4);for(let j=1;j<=counts[p.id];j++)answers[String(i*3+j)]=false;});
 const result=score(answers);assert.deepEqual(result.counts,counts);
 const max=Math.max(...Object.values(counts));
 assert.deepEqual(result.priority_pillars,pillars.filter(p=>max>0&&counts[p.id]===max).map(p=>p.id));
 assert.deepEqual(result.secondary_pillars,pillars.filter(p=>counts[p.id]>0&&counts[p.id]<max).map(p=>p.id));
 }
});
test('validação rejeita resposta faltante, string, extra e contagens inválidas',()=>{
 for(const answers of [{...yes(),1:'false'},{...yes(),19:true},Object.fromEntries(Object.entries(yes()).slice(1))])assert.throws(()=>score(answers as any));
 assert.throws(()=>summarize({vision:4} as any));
});
test('validação normaliza dados e não confia em contagens do cliente',()=>{
 const p={...validPayload(),counts:{vision:3}};const result=validateSubmission(p);
 assert.equal(result.contact.email,'teste@example.invalid');assert.equal('counts' in result,false);
});
test('consentimentos, honeypot, telefone e limites são validados',()=>{
 const mutations=[
 (p:any)=>p.contact.privacy_consent=false,
 (p:any)=>p.contact.marketing_consent='true',
 (p:any)=>p.contact.whatsapp_consent=true,
 (p:any)=>p.website='bot',
 (p:any)=>p.contact.whatsapp='123',
 (p:any)=>p.comments.vision='x'.repeat(2001),
 (p:any)=>p.challenge_90_days=' ',
 (p:any)=>p.contact.state='XX',
 (p:any)=>p.contact.email='errado',
 (p:any)=>p.token='invalido',
 (p:any)=>p.attribution.referrer='javascript:alert(1)'
 ];
 for(const mutate of mutations){const p=validPayload();mutate(p);assert.throws(()=>validateSubmission(p));}
});
test('origem só mantém domínio e CSV neutraliza fórmulas',()=>{
 const p=validPayload() as any;p.attribution.referrer='https://example.org/path?email=teste';
 assert.equal(validateSubmission(p).attribution.referrer,'https://example.org');
 for(const text of ['=SUM(A1:A2)',' +CMD','\t@SUM(1)','\r-1'])assert.ok(csvCell(text).startsWith('"\''));
 assert.equal(csvCell('a"b'),'\"a""b\"');
});
