import {supabase,demoMode} from './supabase.ts';
import {shell,escapeHtml as e,status,date} from './ui.ts';
import {pillars,roles,churchSizes,states} from '../shared/questions.ts';
import {makeCsv} from './csv.ts';
type Row=Record<string,any>;
type Report={cohort_complete?:boolean;rows:Row[];total:number;starts:number;completed:number;marketing:number;distributions:{kind:string;label:string;count:number}[]};
const preview=demoMode && new URLSearchParams(location.search).get('preview')==='1';
let root:HTMLElement,filters:Record<string,string>={},page=0,report:Report|null=null,active=false,requestId=0,exporting=false;
const byId=(id:string)=>document.getElementById(id)!;
const labels:Record<string,string>=Object.fromEntries(pillars.map(p=>[p.id,p.name]));
export async function mountAdmin(app:HTMLElement){
 root=app;root.innerHTML=shell('<main class="login-card">'+status('Verificando acesso…')+'</main>',true);
 if(preview){active=true;await load();return;}
 if(!supabase){login('O painel será disponibilizado após conectar o projeto ao Supabase.');return;}
 supabase.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){active=false;report=null;requestId++;document.querySelector('dialog')?.remove();login();}});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&active)void authorize();});
 await authorize();
}
function login(message=''){
 active=false;
 root.innerHTML=shell(`<main class="login-card"><span class="eyebrow">ACESSO RESTRITO</span><h1>Um olhar<br>sobre os diagnósticos.</h1><p>Entre com sua conta administrativa do Revitalize.</p>${message?status(message):''}<form id="login-form"><label class="field">E-mail<input name="email" type="email" autocomplete="username" required></label><label class="field">Senha<input name="password" type="password" autocomplete="current-password" required minlength="8"></label><div id="login-error"></div><button class="button primary" ${supabase?'':'disabled'}>Entrar no painel ↗</button></form></main>`,true);
 byId('login-form').addEventListener('submit',async event=>{
 event.preventDefault();const f=event.target as HTMLFormElement;const b=f.querySelector('button')!;b.disabled=true;
 const form=new FormData(f);const {error}=await supabase!.auth.signInWithPassword({email:String(form.get('email')),password:String(form.get('password'))});
 if(error){byId('login-error').innerHTML=status('Não foi possível entrar. Confira as credenciais e tente novamente.',true);b.disabled=false;return;}
 await authorize();
 });
}
async function authorize(){
 const {data,error}=await supabase!.auth.getUser();
 if(error||!data.user){login();return;}
 const check=await supabase!.rpc('is_admin');
 if(check.error||check.data!==true){await supabase!.auth.signOut();login('Esta conta não possui permissão administrativa.');return;}
 if(!active){active=true;await load();}
}
function optionList(values:readonly string[],current=''){return '<option value="">Todos</option>'+values.map(v=>`<option value="${e(v)}" ${v===current?'selected':''}>${e(v)}</option>`).join('');}
function input(name:string,label:string,type='text'){return `<label class="field">${label}<input name="${name}" type="${type}" value="${e(filters[name]||'')}" maxlength="120"></label>`;}
function select(name:string,label:string,values:readonly string[]){return `<label class="field">${label}<select name="${name}">${optionList(values,filters[name])}</select></label>`;}
function normalizedFilters(source=filters){
 const f={...source};
 if(f.from)f.from=new Date(f.from+'T00:00:00-03:00').toISOString();
 if(f.to){const d=new Date(f.to+'T00:00:00-03:00');d.setUTCDate(d.getUTCDate()+1);f.to=d.toISOString();}
 return f;
}
async function load(){
 const id=++requestId;
 if(preview){report={rows:[],total:0,starts:0,completed:0,marketing:0,distributions:[]};render();return;}
 root.innerHTML=shell('<main class="admin-page">'+status('Carregando diagnósticos…')+'</main>',true);
 const {data,error}=await supabase!.rpc('admin_report',{filters:normalizedFilters(),page_number:page,page_size:25});
 if(id!==requestId||!active)return;
 if(error){root.innerHTML=shell('<main class="login-card">'+status('Não foi possível carregar o painel. Verifique sua conexão e permissão de acesso.',true)+'<button id="retry" class="button primary">Tentar novamente</button><button id="exit" class="button secondary">Sair</button></main>',true);byId('retry').onclick=()=>void load();byId('exit').onclick=()=>void supabase!.auth.signOut();return;}
 report=data as Report;render();
}
function render(){
 if(!report)return;
 const r=report,cohortValid=r.cohort_complete!==false,rate=cohortValid&&r.starts?Math.round(r.completed/r.starts*100)+'%':'—';
 root.innerHTML=shell(`<main class="admin-page"><div class="admin-heading"><div><span class="eyebrow">RAIO-X REVITALIZE · ADMIN</span><h1>Diagnósticos recebidos</h1><p>Conheça a realidade de quem está caminhando com o Revitalize.</p></div><div class="admin-controls"><button id="refresh" class="button secondary">Atualizar</button><button id="export" class="button secondary" ${exporting?'disabled':''}>Exportar CSV ↓</button><button id="export-pdf" class="button primary" ${exporting?'disabled':''}>Exportar PDF ↓</button><button id="logout" class="button secondary">Sair</button></div></div>
 <form id="filters" class="filters">${input('search','Nome ou e-mail')}${input('from','Início do período','date')}${input('to','Fim do período','date')}${select('role','Função',roles)}${select('church_size','Tamanho da igreja',churchSizes)}${input('city','Cidade')}${select('state','Estado',states)}${input('source','UTM source')}
 <label class="field">Pilar de atenção<select name="priority"><option value="">Todos</option>${pillars.map(p=>`<option value="${p.id}" ${filters.priority===p.id?'selected':''}>${e(p.name)}</option>`).join('')}</select></label>
 <label class="field">Consentimento de marketing<select name="marketing"><option value="">Todos</option><option value="true" ${filters.marketing==='true'?'selected':''}>Autorizado</option><option value="false" ${filters.marketing==='false'?'selected':''}>Não autorizado</option></select></label><button class="button primary">Aplicar filtros</button><button id="clear" type="button" class="button secondary">Limpar filtros</button></form>
 <p class="field-help">Datas consideram o início do diagnóstico (horário de Brasília). Sem datas: últimos 30 dias. Métricas de conclusão consideram todas as sessões do período; demais filtros afetam leads e distribuições. Inícios são retidos por 90 dias. Métricas de conclusão de períodos anteriores não são exibidas.</p><div id="admin-message"></div>
 <section class="metrics"><div class="metric"><span>Diagnósticos iniciados · período</span><strong>${cohortValid?r.starts:'—'}</strong></div><div class="metric"><span>Diagnósticos concluídos · período</span><strong>${cohortValid?r.completed:'—'}</strong></div><div class="metric"><span>Taxa de conclusão · período</span><strong>${rate}</strong></div><div class="metric"><span>Marketing autorizado · filtros</span><strong>${r.marketing}</strong></div></section>
 <section class="admin-charts">${[['priority','Pilares prioritários'],['role','Função na igreja'],['size','Tamanho da igreja'],['location','Cidade / estado'],['source','Origem dos cadastros']].map(([kind,title])=>distribution(kind,title)).join('')}</section>
 <div class="admin-heading"><h2>Leads encontrados <span class="badge">${r.total}</span></h2></div>
 <div class="table-wrap"><table><thead><tr><th>Nome / contato</th><th>Função / igreja</th><th>Cidade</th><th>Áreas de atenção</th><th>Consentimentos</th><th>Concluído em</th><th>Diagnóstico</th></tr></thead><tbody>${r.rows.length?r.rows.map(row=>`<tr><td>${e(row.name)}<small>${e(row.email)}</small></td><td>${e(row.role)}<small>${e(row.church_size)}</small></td><td>${e(row.city)} / ${e(row.state)}</td><td>${row.priority_pillars.map((p:string)=>e(labels[p])).join(', ')||'Base consistente'}</td><td>Marketing: ${row.marketing_consent?'sim':'não'}<small>WhatsApp: ${row.whatsapp_consent?'sim':'não'}</small></td><td>${e(date(row.completed_at))}</td><td><button class="table-button" data-detail="${e(row.submission_id)}">Abrir →</button></td></tr>`).join(''):'<tr><td colspan="7" class="empty">Nenhum diagnóstico encontrado para estes filtros.</td></tr>'}</tbody></table></div>
 <div class="pagination"><button id="previous" class="button secondary" ${page===0?'disabled':''}>← Anterior</button><span>Página ${page+1} de ${Math.max(1,Math.ceil(r.total/25))}</span><button id="next" class="button secondary" ${(page+1)*25>=r.total?'disabled':''}>Próxima →</button></div><p class="field-help">Um diagnóstico pode ter mais de um pilar prioritário. Empates contam em cada pilar correspondente. CSV e PDF exportam todos os leads que correspondem aos filtros.</p></main>`,true);
 if(preview)root.querySelector('main')?.insertAdjacentHTML('afterbegin',status('Prévia visual do painel · Sem conexão com o banco e sem dados reais. O acesso de produção exige login administrativo.'));
 byId('logout').onclick=()=>{if(preview)location.href='/';else void supabase!.auth.signOut();};
 byId('refresh').onclick=()=>void load();
 byId('clear').onclick=()=>{filters={};page=0;void load();};
 byId('filters').onsubmit=event=>{event.preventDefault();const f=Object.fromEntries(new FormData(event.target as HTMLFormElement)) as Record<string,string>;
 if(f.from&&f.to&&f.from>f.to){byId('admin-message').innerHTML=status('A data inicial deve vir antes da data final.',true);return;}
 filters=f;page=0;void load();};
 byId('previous').onclick=()=>{page--;void load();};byId('next').onclick=()=>{page++;void load();};
 byId('export').onclick=()=>{if(preview){byId('admin-message').innerHTML=status('A exportação ficará disponível com os cadastros reais, após a conexão com o banco.');return;}void exportCsv();};
 byId('export-pdf').onclick=()=>{if(preview){byId('admin-message').innerHTML=status('A exportação em PDF ficará disponível com os cadastros reais, após a conexão com o banco.');return;}void exportReportPdf();};
 document.querySelectorAll<HTMLButtonElement>('[data-detail]').forEach(b=>b.onclick=()=>void detail(b.dataset.detail!));
}
function distribution(kind:string,title:string){
 const data=report!.distributions.filter(d=>d.kind===kind);
 return `<article class="distribution"><h2>${title}</h2>${data.length?`<ul>${data.map(d=>`<li><span>${e(kind==='priority'?labels[d.label]:d.label)}</span><strong>${d.count}</strong></li>`).join('')}</ul>`:'<p class="field-help">Sem dados neste período.</p>'}</article>`;
}
function exportBusy(value:boolean){
 exporting=value;
 for(const id of ['export','export-pdf']){
  const button=document.getElementById(id) as HTMLButtonElement|null;
  if(button)button.disabled=value;
 }
}
function exportMessage(message:string,error=false){const box=document.getElementById('admin-message');if(box)box.innerHTML=status(message,error);}
async function collectExport(source:Record<string,string>):Promise<Report>{
 const rows:Row[]=[];let index=0,snapshot:Report|null=null;
 const query=normalizedFilters(source);
 do{
  if(!active)throw new Error('Sessão encerrada.');
  const {data,error}=await supabase!.rpc('admin_report',{filters:query,page_number:index,page_size:500});
  if(error)throw error;if(!active)throw new Error('Sessão encerrada.');
  if(!snapshot)snapshot=data as Report;
  if(!Array.isArray(data.rows)||(!data.rows.length&&rows.length<snapshot.total))throw new Error('Exportação incompleta.');
  rows.push(...data.rows);index++;
 }while(rows.length<snapshot!.total);
 return {...snapshot!,rows};
}
async function exportCsv(){
 if(exporting)return;exportBusy(true);
 const button=byId('export');button.textContent='Exportando CSV…';
 try{
 const data=await collectExport({...filters});
 const columns=['name','email','whatsapp','role','church_size','city','state','marketing_consent','whatsapp_consent','privacy_consent','consent_at','consent_version','privacy_policy_url','utm_source','utm_medium','utm_campaign','utm_content','utm_term','referrer','priority_pillars','secondary_pillars','vision_no_count','diagnosis_no_count','simplification_no_count','discipleship_no_count','change_no_count','conflict_no_count','started_at','completed_at'];
 const csv=makeCsv(data.rows,columns);const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='revitalize-leads-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 exportMessage(data.rows.length+' cadastros exportados. Guarde o arquivo em local restrito à equipe autorizada.');
 }catch{if(active)exportMessage('A exportação falhou. Tente novamente após conferir seu acesso.',true);}
 finally{exportBusy(false);button.textContent='Exportar CSV ↓';}
}
async function exportReportPdf(){
 if(exporting)return;exportBusy(true);
 const button=byId('export-pdf');button.textContent='Gerando PDF…';
 const selected={...filters};
 try{
 const data=await collectExport(selected);
 const {makeAdminPdf,loadPdfLogo,downloadPdf}=await import('./admin-pdf.ts');
 const logo=await loadPdfLogo();if(!active)throw new Error('Sessão encerrada.');
 const bytes=await makeAdminPdf(data,selected,{logo});if(!active)throw new Error('Sessão encerrada.');
 downloadPdf(bytes,'revitalize-relatorio-'+new Date().toISOString().slice(0,10)+'.pdf');
 exportMessage('PDF gerado com '+data.rows.length+' cadastros dos filtros aplicados. Guarde o arquivo em local restrito à equipe autorizada.');
 }catch{if(active)exportMessage('Não foi possível gerar o PDF. Confira sua conexão e acesso e tente novamente.',true);}
 finally{exportBusy(false);button.textContent='Exportar PDF ↓';}
}
async function detail(id:string){
 const {data,error}=await supabase!.from('submissions').select('*,leads(*),answers(*)').eq('id',id).single();
 if(!active)return;
 if(error){byId('admin-message').innerHTML=status('Não foi possível abrir este diagnóstico.',true);return;}
 const row=data as Row,lead=row.leads;
 const dialog=document.createElement('dialog');dialog.className='detail-dialog';
 dialog.innerHTML=`<div class="detail-actions"><button class="button secondary close">Fechar ×</button><button class="button primary" data-submission-pdf>Exportar diagnóstico PDF ↓</button></div><div class="detail-pdf-message"></div><span class="eyebrow">DIAGNÓSTICO COMPLETO</span><h2>${e(lead.name)}</h2><div class="detail-grid">${[['E-mail',lead.email],['WhatsApp',lead.whatsapp||'Não informado'],['Função',lead.role],['Tamanho',lead.church_size],['Local',lead.city+' / '+lead.state],['Início',date(row.started_at)],['Conclusão',date(row.completed_at)],['Duração',row.duration_seconds+' segundos'],['Marketing',lead.marketing_consent?'Autorizado':'Não autorizado'],['WhatsApp',lead.whatsapp_consent?'Autorizado':'Não autorizado'],['Consentimento',date(lead.consent_at)+' · '+lead.consent_version],['UTM source',lead.utm_source||'Não informado'],['UTM medium',lead.utm_medium||'Não informado'],['UTM campaign',lead.utm_campaign||'Não informado'],['UTM content',lead.utm_content||'Não informado'],['UTM term',lead.utm_term||'Não informado'],['Referrer',lead.referrer||'Não informado']].map(([k,v])=>`<p><strong>${e(k)}</strong>${e(v)}</p>`).join('')}</div>
 ${pillars.map((p,i)=>`<section><h3>${e(p.name)} · ${row[p.id+'_no_count']} “Não”</h3>${p.questions.map((q,j)=>{const answer=row.answers.find((a:Row)=>a.question_id===i*3+j+1);return `<p>${e(q)}<br><strong>${answer?.answer?'Sim':'Não'}</strong></p>`;}).join('')}<p><strong>Comentário</strong><br>${e(row.answers.find((a:Row)=>a.pillar===p.id&&a.comment)?.comment||'Não informado')}</p></section>`).join('')}
 <h3>Desafio para os próximos 90 dias</h3><p>${e(row.challenge_90_days)}</p>`;
 document.body.append(dialog);dialog.querySelector<HTMLButtonElement>('.close')!.onclick=()=>dialog.close();
 const pdfButton=dialog.querySelector<HTMLButtonElement>('[data-submission-pdf]')!;
 pdfButton.onclick=async()=>{
  if(pdfButton.disabled||!active)return;pdfButton.disabled=true;pdfButton.textContent='Gerando PDF…';
  const message=dialog.querySelector('.detail-pdf-message')!;
  try{
   const {makeSubmissionPdf,loadPdfLogo,downloadPdf}=await import('./admin-pdf.ts'),logo=await loadPdfLogo();
   if(!active||!dialog.open)return;
   const bytes=await makeSubmissionPdf(row,{logo});if(!active||!dialog.open)return;
   downloadPdf(bytes,'revitalize-diagnostico-'+String(row.id)+'.pdf');
   message.innerHTML=status('PDF do diagnóstico gerado.');
  }catch{if(active&&dialog.open)message.innerHTML=status('Não foi possível gerar este PDF. Confira sua conexão e tente novamente.',true);}
  finally{pdfButton.disabled=false;pdfButton.textContent='Exportar diagnóstico PDF ↓';}
 };
 dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
}
