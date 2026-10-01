import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont,type PDFImage} from 'pdf-lib';
import {pillars,questionId} from '../shared/questions.ts';
import {levels} from '../shared/scoring.ts';

export type PdfRow=Record<string,any>;
export type PdfReport={cohort_complete?:boolean;rows:PdfRow[];total:number;starts:number;completed:number;marketing:number;distributions:{kind:string;label:string;count:number}[]};
type Options={logo?:Uint8Array;generatedAt?:Date};
const green=rgb(.09,.30,.23),muted=rgb(.36,.42,.38),ink=rgb(.14,.18,.16),line=rgb(.85,.89,.84),pale=rgb(.94,.96,.92);
const pageWidth=595.28,pageHeight=841.89,margin=44,contentWidth=pageWidth-margin*2;
const pillarNames:Record<string,string>=Object.fromEntries(pillars.map(p=>[p.id,p.name]));
const value=(v:unknown)=>v===null||v===undefined||v===''?'Não informado':String(v);
const consent=(v:unknown)=>v===true?'Autorizado':v===false?'Não autorizado':'Não informado';
function localDate(v:unknown){
 if(!v)return 'Não informado';
 const d=new Date(String(v));return Number.isNaN(d.getTime())?value(v):d.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'});
}
function namedPillars(ids:unknown){return Array.isArray(ids)&&ids.length?ids.map(id=>pillarNames[id]||String(id)).join(' · '):'Nenhum';}

/** Paginated PDF writer. All personal data stays in the authenticated browser. */
class ReportWriter{
 doc:PDFDocument;regular:PDFFont;bold:PDFFont;logo?:PDFImage;page!:PDFPage;y=0;unicodeFallback=false;
 constructor(doc:PDFDocument,regular:PDFFont,bold:PDFFont,logo?:PDFImage){this.doc=doc;this.regular=regular;this.bold=bold;this.logo=logo;}
 static async create(title:string,options:Options){
  const doc=await PDFDocument.create();doc.setTitle(title);doc.setAuthor('Revitalize');doc.setCreator('Raio-X Revitalize');doc.setCreationDate(options.generatedAt||new Date());
  const regular=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
  const logo=options.logo?await doc.embedJpg(options.logo):undefined;
  return new ReportWriter(doc,regular,bold,logo);
 }
 safe(text:string){
  return Array.from(text.normalize('NFC')).map(char=>{
   if(char==='\n')return char;
   if(char==='\t')return ' ';
   if(/[\u0000-\u001f\u007f]/.test(char))return '';
   try{this.regular.encodeText(char);return char;}catch{this.unicodeFallback=true;return '[U+'+char.codePointAt(0)!.toString(16).toUpperCase()+']';}
  }).join('');
 }
 lines(text:string,font:PDFFont,size:number,width:number){
  const lines:string[]=[];
  for(const paragraph of this.safe(text).split('\n')){
   let current='';
   for(const word of paragraph.split(/\s+/).filter(Boolean)){
    const candidate=current?current+' '+word:word;
    if(font.widthOfTextAtSize(candidate,size)<=width){current=candidate;continue;}
    if(current){lines.push(current);current='';}
    let fragment='';
    for(const char of word){
     if(fragment&&font.widthOfTextAtSize(fragment+char,size)>width){lines.push(fragment);fragment='';}
     fragment+=char;
    }
    current=fragment;
   }
   lines.push(current);
  }
  return lines;
 }
 newPage(){
  this.page=this.doc.addPage([pageWidth,pageHeight]);
  if(this.logo)this.page.drawImage(this.logo,{x:margin,y:pageHeight-76,width:185,height:185*398/1600});
  else this.page.drawText('Revitalize',{x:margin,y:pageHeight-52,size:20,font:this.bold,color:green});
  this.page.drawText('RAIO-X · RELATÓRIO ADMINISTRATIVO',{x:margin,y:pageHeight-96,size:8,font:this.regular,color:muted});
  this.page.drawLine({start:{x:margin,y:pageHeight-108},end:{x:pageWidth-margin,y:pageHeight-108},color:line,thickness:1});
  this.y=pageHeight-135;
 }
 ensure(height:number){if(!this.page||this.y-height<62)this.newPage();}
 text(text:string,size=10,bold=false,color=ink,indent=0,gap=7){
  const font=bold?this.bold:this.regular,rows=this.lines(text,font,size,contentWidth-indent),height=size*1.45;
  for(const row of rows){this.ensure(height);this.page.drawText(row,{x:margin+indent,y:this.y,size,font,color});this.y-=height;}
  this.y-=gap;
 }
 heading(text:string){this.ensure(62);this.y-=10;this.text(text,17,true,green,0,12);}
 field(label:string,v:unknown){this.text(label+': '+value(v),9,false,ink,0,5);}
 banner(title:string,subtitle:string){
  this.ensure(88);
  this.page.drawRectangle({x:margin,y:this.y-70,width:contentWidth,height:86,color:pale});
  this.y-=8;this.text(title,20,true,green,15,8);this.text(subtitle,10,false,muted,15,15);
 }
 divider(){this.ensure(24);this.page.drawLine({start:{x:margin,y:this.y},end:{x:pageWidth-margin,y:this.y},color:line,thickness:1});this.y-=20;}
 async finish(){
  if(this.unicodeFallback){this.heading('Nota de leitura');this.text('Caracteres que a fonte não representa aparecem pelo código Unicode entre colchetes, por exemplo [U+1F64F]. O conteúdo original permanece disponível no painel e no CSV.',9,false,muted);}
  const pages=this.doc.getPages();
  pages.forEach((page,i)=>{
   page.drawLine({start:{x:margin,y:44},end:{x:pageWidth-margin,y:44},color:line,thickness:1});
   page.drawText('Revitalize · Uso restrito à equipe autorizada',{x:margin,y:28,size:8,font:this.regular,color:muted});
   const text='Página '+(i+1)+' de '+pages.length;
   page.drawText(text,{x:pageWidth-margin-this.regular.widthOfTextAtSize(text,8),y:28,size:8,font:this.regular,color:muted});
  });
  return this.doc.save();
 }
}
function filterDescription(filters:Record<string,string>){
 const labels:Record<string,string>={search:'Nome ou e-mail',from:'Data inicial',to:'Data final',role:'Função',church_size:'Tamanho da igreja',city:'Cidade',state:'Estado',source:'UTM source',priority:'Pilar de atenção',marketing:'Marketing'};
 return Object.entries(filters).filter(([,v])=>v).map(([key,v])=>[labels[key]||key,key==='priority'?pillarNames[v]||v:key==='marketing'?consent(v==='true'):v]);
}
function leadFields(w:ReportWriter,row:PdfRow){
 w.field('E-mail',row.email);w.field('WhatsApp',row.whatsapp);
 w.field('Função',row.role);w.field('Tamanho da igreja',row.church_size);
 w.field('Cidade / estado',[row.city,row.state].filter(Boolean).join(' / '));
 w.field('Áreas de maior atenção',Array.isArray(row.priority_pillars)&&row.priority_pillars.length?namedPillars(row.priority_pillars):'Base consistente nas seis áreas');
 w.field('Outras áreas de atenção',namedPillars(row.secondary_pillars));
 w.text('Classificação das seis áreas',10,true,green,0,7);
 for(const p of pillars){const count=row[p.id+'_no_count'];w.field(p.name,Number.isInteger(count)&&count>=0&&count<=3?levels[count]+' · '+count+' de 3 Não':'Não informado');}
 w.field('Marketing',consent(row.marketing_consent));w.field('Contato por WhatsApp',consent(row.whatsapp_consent));w.field('Privacidade',consent(row.privacy_consent));
 w.field('Consentimento registrado em',localDate(row.consent_at));w.field('Versão do consentimento',row.consent_version);w.field('Política de privacidade',row.privacy_policy_url);
 for(const [key,label] of [['utm_source','UTM source'],['utm_medium','UTM medium'],['utm_campaign','UTM campaign'],['utm_content','UTM content'],['utm_term','UTM term'],['referrer','Referência']])w.field(label,row[key]);
 w.field('Início',localDate(row.started_at));w.field('Conclusão',localDate(row.completed_at));
}
export async function makeAdminPdf(report:PdfReport,filters:Record<string,string>,options:Options={}){
 const w=await ReportWriter.create('Raio-X Revitalize · Relatório de diagnósticos',options);w.newPage();
 w.banner('Diagnósticos recebidos',report.rows.length+' cadastros exportados · '+localDate((options.generatedAt||new Date()).toISOString()));
 w.heading('Filtros aplicados');
 const applied=filterDescription(filters);if(applied.length)applied.forEach(([k,v])=>w.field(k,v));else w.text('Todos os cadastros dos últimos 30 dias.',10,false,muted);
 if(!filters.from&&!filters.to&&applied.length)w.field('Período','Últimos 30 dias');
 w.text('Datas referem-se ao início do diagnóstico, no horário de Brasília.',9,false,muted);
 w.heading('Resumo do painel');
 const cohort=report.cohort_complete!==false;
 w.field('Diagnósticos iniciados no período',cohort?report.starts:'Indisponível para este período');
 w.field('Diagnósticos concluídos no período',cohort?report.completed:'Indisponível para este período');
 w.field('Taxa de conclusão no período',cohort&&report.starts?Math.round(report.completed/report.starts*100)+'%':'Indisponível');
 w.field('Leads encontrados nos filtros',report.total);w.field('Marketing autorizado nos filtros',report.marketing);
 w.text('As métricas de conclusão consideram todas as sessões do período. Os demais filtros afetam a lista de cadastros e as distribuições. Inícios são retidos por 90 dias.',9,false,muted);
 for(const [kind,title] of [['priority','Pilares prioritários'],['role','Função na igreja'],['size','Tamanho da igreja'],['location','Cidade / estado'],['source','Origem dos cadastros']]){
  w.heading(title);const items=report.distributions.filter(d=>d.kind===kind);
  if(!items.length)w.text('Sem dados neste período.',10,false,muted);
  else items.forEach(item=>w.field(kind==='priority'?pillarNames[item.label]||item.label:item.label,item.count));
 }
 w.text('Empates entram na contagem de cada pilar correspondente. As contagens por pilar podem somar mais que o número de diagnósticos.',9,false,muted);
 w.newPage();w.heading('Cadastros incluídos');
 if(!report.rows.length)w.text('Nenhum diagnóstico encontrado para estes filtros.',11,false,muted);
 report.rows.forEach((row,i)=>{w.ensure(125);w.heading(String(i+1).padStart(2,'0')+' · '+value(row.name));leadFields(w,row);w.divider();});
 return w.finish();
}
export async function makeSubmissionPdf(row:PdfRow,options:Options={}){
 const lead=row.leads||{},w=await ReportWriter.create('Raio-X Revitalize · Diagnóstico individual',options);w.newPage();
 w.banner('Diagnóstico individual',localDate((options.generatedAt||new Date()).toISOString()));
 w.heading(value(lead.name));leadFields(w,{...lead,...row});w.field('Duração',typeof row.duration_seconds==='number'?row.duration_seconds+' segundos':'Não informado');
 const answers:Array<PdfRow>=Array.isArray(row.answers)?row.answers:[];
 for(const [i,p] of pillars.entries()){
  w.heading(p.name);
  p.questions.forEach((q,j)=>{const answer=answers.find(a=>String(a.question_id)===questionId(i,j));w.text(q,10,true);w.field('Resposta',answer?.answer===true?'Sim':answer?.answer===false?'Não':'Não informado');});
  w.text('Comentário compartilhado',10,true,green);
  w.text(value(answers.find(a=>a.pillar===p.id&&a.comment)?.comment),10);
 }
 w.heading('Desafio para os próximos 90 dias');w.text(value(row.challenge_90_days),11);
 return w.finish();
}
export async function loadPdfLogo(){
 const response=await fetch('/brand/revitalize-logo.jpg',{credentials:'omit'});
 if(!response.ok)throw new Error('Não foi possível carregar o logotipo.');
 return new Uint8Array(await response.arrayBuffer());
}
export function downloadPdf(bytes:Uint8Array,filename:string){
 const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'})),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
