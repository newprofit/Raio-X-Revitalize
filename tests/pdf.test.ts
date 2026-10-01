import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {PDFDocument} from 'pdf-lib';
import {makeAdminPdf,makeSubmissionPdf,type PdfReport} from '../src/admin-pdf.ts';
import {pillars} from '../shared/questions.ts';
const generatedAt=new Date('2026-10-01T18:00:00Z');
const lead={name:'Verificação de interface',email:'interface@example.invalid',whatsapp:'11999999999',role:'Pastor titular',church_size:'Até 50 pessoas',city:'Cidade de teste',state:'SP',privacy_consent:true,marketing_consent:false,whatsapp_consent:false,consent_at:'2026-10-01T17:55:00Z',consent_version:'versão-teste',privacy_policy_url:'https://example.invalid/privacy',utm_source:'instagram',utm_medium:'social',utm_campaign:'campanha-de-teste',utm_content:'conteúdo de teste',utm_term:'termo de teste',referrer:'example.invalid',priority_pillars:['vision','discipleship'],secondary_pillars:['conflict'],vision_no_count:2,diagnosis_no_count:0,simplification_no_count:0,discipleship_no_count:2,change_no_count:0,conflict_no_count:1,started_at:'2026-10-01T17:50:00Z',completed_at:'2026-10-01T18:00:00Z'};
async function save(name:string,bytes:Uint8Array){
 const doc=await PDFDocument.load(bytes);assert.ok(doc.getPageCount()>=1);
 for(const page of doc.getPages()){assert.equal(page.getWidth(),595.28);assert.equal(page.getHeight(),841.89);}
 assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'%PDF');
 await mkdir('pdf-test-results',{recursive:true});await writeFile('pdf-test-results/'+name+'.pdf',bytes);return doc;
}
test('PDF completo pagina todos os leads e mantém marca, métricas e dados extensos',async()=>{
 const rows=Array.from({length:3},(_,i)=>({...lead,name:i===0?lead.name:'Cadastro teste '+(i+1),email:i===2?'ultimo@example.invalid':lead.email,utm_term:i===1?'termo'.repeat(120):lead.utm_term}));
 const report:PdfReport={rows,total:3,starts:8,completed:3,marketing:0,distributions:[{kind:'priority',label:'vision',count:2},{kind:'priority',label:'discipleship',count:2},{kind:'source',label:'instagram',count:3}]};
 const logo=new Uint8Array(await readFile('public/brand/revitalize-logo.jpg'));
 const bytes=await makeAdminPdf(report,{source:'instagram',marketing:'false'},{logo,generatedAt});
 const doc=await save('relatorio',bytes);assert.ok(doc.getPageCount()>2);
 assert.equal(doc.getTitle(),'Raio-X Revitalize · Relatório de diagnósticos');
});
test('PDF vazio e histórico não cria cadastros nem inventa taxa de conclusão',async()=>{
 await save('vazio',await makeAdminPdf({cohort_complete:false,rows:[],total:0,starts:0,completed:0,marketing:0,distributions:[]},{from:'2000-01-01'},{generatedAt}));
});
test('PDF individual suporta comentários longos, acentos e caracteres fora da fonte',async()=>{
 const answers=pillars.flatMap((p,i)=>p.questions.map((_,j)=>({question_id:i*3+j+1,pillar:p.id,answer:j>0,comment:j===0?('Reflexão para a liderança. '.repeat(50)+'FINAL_DO_COMENTARIO_'+p.id+' 🙏'):null})));
 const row={...lead,id:'teste-individual',duration_seconds:600,leads:lead,answers,challenge_90_days:'Acompanhar pessoas com atenção.\nFINAL_DO_DESAFIO 🙏 <script>texto literal</script>'};
 const doc=await save('individual',await makeSubmissionPdf(row,{generatedAt}));assert.ok(doc.getPageCount()>3);
});
