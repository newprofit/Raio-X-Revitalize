import './styles.css';
import { pillars,roles,churchSizes,states,questionId } from '../shared/questions.ts';
import { score,type Diagnosis } from '../shared/scoring.ts';
import { resultClosing } from './results.ts';
import { renderResultBody,type ResultContext } from './result-view.ts';
import { track } from './analytics.ts';
import { restoreDraft,newDraft,saveDraft,clearDraft,attribution,type Draft } from './storage.ts';
import { demoMode,privacyUrl,publicRequest,validHttps } from './supabase.ts';
import { shell,escapeHtml as e,arrow,status } from './ui.ts';
import { mountTurnstile,destroyTurnstile,resetTurnstile } from './turnstile.ts';
const app=document.querySelector<HTMLDivElement>('#app')!;
let draft:Draft=restoreDraft()||newDraft();
let resumed=Object.keys(draft.answers).length>0;
let mode:'intro'|'quiz'|'result'='intro';
let contact:Record<string,string|boolean>={};
let busy=false,token='',result:Diagnosis|null=null,storageWarning=false;
let resultContext:ResultContext={answers:{},comments:{},challenge:''};
const source=attribution();
const bind=(selector:string,event:string,fn:(event:Event)=>void)=>document.querySelector(selector)?.addEventListener(event,fn);
function persist(){if(!saveDraft(draft))storageWarning=true;}
function focusTitle(){document.querySelector<HTMLElement>('h1')?.focus();window.scrollTo({top:0,behavior:'instant'});}
const demoBanner=()=>demoMode?status('Prévia local · Você pode experimentar o diagnóstico. Nenhum dado será enviado ou cadastrado.'):'';
function intro(){
 app.innerHTML=shell(demoBanner()+`<main class="landing">
 <section class="hero-copy"><div class="eyebrow"><span class="tiny-dot"></span> UM OLHAR PARA A SUA IGREJA</div>
 <h1 tabindex="-1">Raio-X<br><em>Revitalize.</em></h1>
 <p class="hero-subtitle">Um diagnóstico inicial para ajudar você a identificar quais áreas da sua igreja merecem mais atenção neste momento.</p>
 <p class="muted hero-description">Responda algumas perguntas sobre a realidade da sua igreja. Ao final, você receberá uma leitura inicial das áreas que parecem estar mais consistentes e das que podem merecer maior atenção.</p>
 <div id="start-error"></div><button id="start" class="button primary large">${resumed?'Continuar diagnóstico':'Iniciar diagnóstico'} ${arrow}</button>
 ${resumed?'<button id="restart" class="text-button">Apagar progresso e recomeçar</button>':''}
 <div class="hero-meta"><span>✓ Gratuito</span><span>✓ 6 áreas de reflexão</span><span>✓ Resultado personalizado</span></div>
 </section><section class="hero-visual" aria-label="Seis pilares do diagnóstico">
 <div class="visual-top"><span class="eyebrow">UM RETRATO DO SEU MOMENTO</span><span class="corner-icon">↗</span></div>
 <div class="orbit" aria-hidden="true"><div class="orbit-circle one"></div><div class="orbit-circle two"></div><div class="orbit-line vertical"></div><div class="orbit-line horizontal"></div><div class="orbit-core">r<span>↗</span></div><span class="orbit-dot a"></span><span class="orbit-dot b"></span><span class="orbit-dot c"></span><span class="orbit-dot d"></span></div>
 <h2>Clareza para o<br>próximo passo.</h2>
 <div class="pillar-preview">${pillars.map((p,i)=>`<div><span>0${i+1}</span>${e(p.short)}</div>`).join('')}</div>
 <div class="visual-bottom"><span>ESCUTAR. COMPREENDER. CAMINHAR.</span><span>06 / PILARES</span></div>
 </section></main><section class="intro-bottom"><span class="eyebrow">ANTES DE COMEÇAR</span><p>Responda a partir da realidade de hoje.<br><strong>Não há uma igreja perfeita. Há um próximo passo possível.</strong></p><p class="muted">Seu progresso fica salvo neste dispositivo por até 7 dias. Você pode voltar e revisar suas respostas antes de concluir.</p></section>`);
 bind('#start','click',()=>void start());
 bind('#restart','click',()=>{if(confirm('Apagar as respostas salvas neste dispositivo e começar novamente?')){clearDraft();draft=newDraft();resumed=false;intro();}});
}
async function start(){
 if(busy)return;busy=true;
 const button=document.querySelector<HTMLButtonElement>('#start')!;button.disabled=true;button.textContent='Preparando…';
 try{
 if(!demoMode && !draft.token){const s=await publicRequest('start');draft.token=s.token;draft.startedAt=s.started_at;}
 draft.step=resumed?draft.step:0;persist();mode='quiz';track('quiz_start');render();focusTitle();
 }catch(err){document.querySelector('#start-error')!.innerHTML=status((err as Error).message,true);button.disabled=false;button.innerHTML='Tentar novamente '+arrow;}
 finally{busy=false;}
}
function sidebar(){
 return `<aside class="quiz-sidebar"><a class="back-home" href="/">← Início</a><div class="eyebrow">SEU RAIO-X</div><h2>Um passo<br>de cada vez.</h2><nav aria-label="Etapas do diagnóstico"><ol>${pillars.map((p,i)=>`<li class="${draft.step===i?'active':draft.step>i?'done':''}"><span>${draft.step>i?'✓':String(i+1).padStart(2,'0')}</span>${e(p.short)}</li>`).join('')}<li class="${draft.step===6?'active':draft.step>6?'done':''}"><span>07</span>Seu desafio</li><li class="${draft.step===7?'active':''}"><span>08</span>Seu resultado</li></ol></nav><p class="sidebar-note">Este diagnóstico é um convite à reflexão sobre a realidade da sua igreja.</p></aside>`;
}
function render(){
 destroyTurnstile();token='';
 if(mode==='intro'){intro();return;}
 if(mode==='result'){renderResult();return;}
 const count=Object.keys(draft.answers).length+(draft.challenge.trim()?1:0);
 app.innerHTML=shell(demoBanner()+`<main class="quiz-layout">${sidebar()}<section class="quiz-main">
 <div class="progress-top"><span>ETAPA ${draft.step+1} DE 8</span><span>${draft.step<6?'Conhecendo sua igreja':draft.step===6?'Uma última reflexão':'Quase lá'}</span></div>
 <progress max="20" value="${count}" aria-label="Progresso do diagnóstico"></progress>
 ${storageWarning?status('Não foi possível salvar neste navegador. Mantenha esta página aberta para não perder as respostas.',true):''}
 <div id="quiz-content">${draft.step<6?pillarForm():draft.step===6?challengeForm():contactForm()}</div></section></main>`);
 bind('#back','click',()=>{captureContact();if(draft.step===0){mode='intro';resumed=true;}else draft.step--;persist();render();focusTitle();});
 bind('#step-form','submit',event=>{event.preventDefault();if(draft.step<6){
 if(!draft.trackedPillars.includes(pillars[draft.step].id)){track('pillar_complete');draft.trackedPillars.push(pillars[draft.step].id);}
 } else if(!draft.challenge.trim()){document.querySelector<HTMLTextAreaElement>('#challenge')!.setCustomValidity('Conte um pouco sobre seu desafio.');document.querySelector<HTMLTextAreaElement>('#challenge')!.reportValidity();return;}
 draft.step++;persist();render();focusTitle();});
 document.querySelectorAll<HTMLInputElement>('input[data-answer]').forEach(el=>el.addEventListener('change',()=>{draft.answers[el.dataset.answer!]=el.value==='yes';persist();updateProgress();}));
 bind('#comment','input',event=>{draft.comments[pillars[draft.step].id]=(event.target as HTMLTextAreaElement).value;persist();});
 bind('#challenge','input',event=>{const el=event.target as HTMLTextAreaElement;el.setCustomValidity('');draft.challenge=el.value;persist();updateProgress();});
 if(draft.step===7){
 bind('#contact-form','submit',event=>{event.preventDefault();void submit();});
 bind('#whatsapp','input',()=>{captureContact();const has=Boolean(String(contact.whatsapp||'').trim());document.querySelector<HTMLElement>('#whatsapp-consent')!.hidden=!has;const cb=document.querySelector<HTMLInputElement>('[name="whatsapp_consent"]')!;if(!has){cb.checked=false;contact.whatsapp_consent=false;}});
 if(!demoMode)void mountTurnstile(document.querySelector('#turnstile')!,value=>{token=value;},()=>{document.querySelector('#submit-error')!.innerHTML=status('A verificação de segurança não carregou. Confira sua conexão e atualize a página. Suas respostas estão salvas.',true);});
 }
}
function updateProgress(){const p=document.querySelector('progress');if(p)p.value=Object.keys(draft.answers).length+(draft.challenge.trim()?1:0);}
function buttons(last=false){return `<div class="form-actions"><button type="button" id="back" class="button secondary">${draft.step===0?'← Início':'← Voltar'}</button><button class="button primary" type="submit">${last?'Ver meu Raio-X':'Continuar'} ${arrow}</button></div>`;}
function pillarForm(){
 const p=pillars[draft.step];
 return `<div class="section-heading"><span class="eyebrow">PILAR 0${draft.step+1}</span><h1 tabindex="-1">${e(p.name)}</h1><p class="muted">${e(p.description)}</p></div>
 <form id="step-form"><div class="questions">${p.questions.map((q,i)=>{const id=questionId(draft.step,i);return `<fieldset class="question"><legend><span class="question-number">${id.padStart(2,'0')}</span>${e(q)}</legend><div class="answer-options">${[true,false].map(v=>`<label class="answer-option"><input data-answer="${id}" type="radio" name="q${id}" value="${v?'yes':'no'}" ${draft.answers[id]===v?'checked':''} required><span><span class="radio-circle"></span>${v?'Sim':'Não'}</span></label>`).join('')}</div></fieldset>`;}).join('')}</div>
 <div class="comment-field"><label for="comment">${e(p.comment)} <span class="optional">Opcional</span></label><textarea id="comment" maxlength="2000" rows="3" placeholder="Se desejar, compartilhe um pouco do seu contexto.">${e(draft.comments[p.id]||'')}</textarea><p class="field-help">Evite nomes ou informações pessoais de outras pessoas.</p></div>${buttons()}</form>`;
}
function challengeForm(){return `<div class="section-heading"><span class="eyebrow">OLHANDO PARA A FRENTE</span><h1 tabindex="-1">Um desafio.<br>Um próximo passo.</h1><p class="muted">Antes de ver o resultado, conte o que mais importa agora.</p></div><form id="step-form"><label class="large-label" for="challenge">Se você pudesse resolver apenas um problema da sua igreja nos próximos 90 dias, qual seria?</label><textarea id="challenge" rows="7" maxlength="3000" required placeholder="Conte qual desafio você gostaria de enfrentar primeiro.">${e(draft.challenge)}</textarea><p class="field-help">Evite identificar outras pessoas. Sua resposta faz parte do seu diagnóstico.</p>${buttons()}</form>`;}
function input(name:string,label:string,type='text',required=true,extra=''){return `<label class="field">${label}<input name="${name}" id="${name}" type="${type}" ${required?'required':''} value="${e(contact[name]||'')}" ${extra}></label>`;}
function select(name:string,label:string,items:readonly string[]){return `<label class="field">${label}<select name="${name}" required><option value="">Selecione</option>${items.map(v=>`<option ${contact[name]===v?'selected':''}>${e(v)}</option>`).join('')}</select></label>`;}
function contactForm(){return `<div class="section-heading"><span class="eyebrow">SEU PRÓXIMO PASSO COMEÇA AQUI</span><h1 tabindex="-1">Seu Raio-X<br>está pronto.</h1><p class="muted">Preencha seus dados para gerar e armazenar seu diagnóstico.</p></div>
 <form id="contact-form"><div class="contact-grid">${input('name','Nome','text',true,'maxlength="120" minlength="2" autocomplete="name"')}${input('email','E-mail','email',true,'maxlength="254" autocomplete="email"')}${input('whatsapp','WhatsApp <span class="optional">Opcional</span>','tel',false,'maxlength="30" autocomplete="tel" placeholder="(11) 99999-9999"')}${select('role','Função',roles)}${select('church_size','Tamanho aproximado da igreja',churchSizes)}${input('city','Cidade','text',true,'maxlength="120" autocomplete="address-level2"')}${select('state','Estado',states)}</div>
 <div class="honeypot" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
 <div class="consents"><label class="check"><input type="checkbox" name="privacy_consent" required ${contact.privacy_consent?'checked':''}><span>Li e concordo com a <a href="${e(privacyUrl||'/privacidade')}" target="_blank" rel="noopener noreferrer">Política de Privacidade</a> e autorizo o tratamento dos meus dados para gerar e armazenar meu diagnóstico Revitalize.</span></label>
 <label class="check"><input type="checkbox" name="marketing_consent" ${contact.marketing_consent?'checked':''}><span>Quero receber conteúdos, materiais e novidades do Revitalize. <span class="optional">Opcional</span></span></label>
 <label id="whatsapp-consent" class="check" ${contact.whatsapp?'':'hidden'}><input type="checkbox" name="whatsapp_consent" ${contact.whatsapp_consent?'checked':''}><span>Autorizo o Revitalize a entrar em contato comigo pelo WhatsApp informado. <span class="optional">Opcional</span></span></label></div>
 <div id="turnstile"></div><div id="submit-error"></div>
 ${!demoMode&&!privacyUrl?status('O cadastro ainda não está disponível. A política de privacidade está em configuração.',true):''}
 ${buttons(true)}<p class="field-help">Seus dados de contato não ficam salvos neste dispositivo pelo formulário.</p></form>`;}
function captureContact(){
 const form=document.querySelector<HTMLFormElement>('#contact-form');if(!form)return;
 const data=new FormData(form);contact=Object.fromEntries(data.entries()) as Record<string,string|boolean>;
 for(const key of ['privacy_consent','marketing_consent','whatsapp_consent'])contact[key]=data.has(key);
 if(!String(contact.whatsapp||'').trim())contact.whatsapp_consent=false;
}
async function submit(){
 if(busy)return;captureContact();
 const errorBox=document.querySelector('#submit-error')!;
 if(!demoMode && (!token || !privacyUrl)){errorBox.innerHTML=status('Conclua a verificação de segurança. O cadastro precisa estar configurado para envio.',true);return;}
 busy=true;const button=document.querySelector<HTMLButtonElement>('#contact-form button[type=submit]')!;button.disabled=true;button.textContent='Gerando seu Raio-X…';
 track('contact_submit');
 try{
 if(demoMode)result=score(draft.answers);
 else {const data=await publicRequest('submit',{token:draft.token,answers:draft.answers,comments:draft.comments,challenge_90_days:draft.challenge,contact,attribution:source,website:contact.website||'',turnstile_token:token});result=data.result;}
 resultContext={answers:{...draft.answers},comments:{...draft.comments},challenge:draft.challenge};
 mode='result';clearDraft();contact={};draft=newDraft();track('quiz_complete');render();track('result_view');focusTitle();
 }catch(err){if((err as {status?:number}).status===409){delete draft.token;persist();}errorBox.innerHTML=status((err as Error).message,true)+((err as {status?:number}).status===409?'<a href="/">Voltar ao início e continuar com as respostas salvas</a>':'');resetTurnstile();token='';button.disabled=false;button.innerHTML='Tentar novamente '+arrow;}
 finally{busy=false;}
}
function renderResult(){
 if(!result)return;
 const cta=validHttps(import.meta.env.VITE_RESULT_CTA_URL);
 app.innerHTML=shell(demoBanner()+`<main class="result-page result-report">${renderResultBody(result,resultContext)}
 <section class="result-closing"><span class="eyebrow">UM PRÓXIMO PASSO POSSÍVEL</span><h2>Você não precisa resolver<br>tudo de uma vez.</h2><p>Comece por uma conversa honesta, escolha um passo possível e caminhe com sua liderança.</p><p>${e(resultClosing)}</p><div class="result-actions">${cta?`<a id="result-cta" class="button primary" href="${e(cta)}" target="_blank" rel="noopener noreferrer">${e(import.meta.env.VITE_RESULT_CTA_LABEL||'Conhecer o Revitalize')} ${arrow}</a>`:''}<button id="print" class="button secondary">Salvar ou imprimir resultado</button></div></section></main>`);
 bind('#result-cta','click',()=>track('result_cta_click'));
 bind('#print','click',()=>{
  track('result_cta_click');
  const details=Array.from(document.querySelectorAll<HTMLDetailsElement>('.result-card details'));
  const states=details.map(detail=>detail.open);
  details.forEach(detail=>{detail.open=true;});
  window.addEventListener('afterprint',()=>details.forEach((detail,i)=>{detail.open=states[i];}),{once:true});
  window.print();
 });
}
function privacy(){
 app.innerHTML=shell(`<main class="privacy-page"><span class="eyebrow">PRIVACIDADE</span><h1>Seus dados,<br>com transparência.</h1>${privacyUrl?`<p>Consulte a versão vigente da Política de Privacidade do Revitalize.</p><a class="button primary" href="${e(privacyUrl)}" rel="noopener noreferrer">Ler Política de Privacidade ↗</a>`:status('A política de privacidade está em configuração. O envio de cadastros reais ficará indisponível até sua publicação.')}
 <h2>Como o diagnóstico funciona</h2><p>As respostas, comentários e dados de contato são usados para gerar e armazenar o diagnóstico. Podem revelar vínculo religioso. O acesso completo é restrito à equipe administrativa autorizada.</p><p>O recebimento de conteúdos e o contato por WhatsApp dependem de autorizações opcionais e separadas. Nenhum texto, resposta ou resultado é enviado a plataformas de anúncios pela aplicação.</p><h2>Progresso neste dispositivo</h2><p>O questionário é salvo localmente por até 7 dias, para permitir que você continue depois. Ao concluir, o rascunho é apagado. Os campos de contato não são gravados no rascunho.</p><button id="clear-local" class="button secondary">Apagar meu progresso neste dispositivo</button><p class="field-help">Isso não exclui um diagnóstico já enviado ao Revitalize.</p><div id="privacy-status"></div></main>`);
 bind('#clear-local','click',()=>{clearDraft();document.querySelector('#privacy-status')!.innerHTML=status('Progresso local apagado.');});
}
if(location.pathname.startsWith('/admin')){void import('./admin.ts').then(m=>m.mountAdmin(app));}
else if(location.pathname==='/privacidade')privacy();
else {track('quiz_view');render();}
