import {pillars,questionId,type PillarId} from '../shared/questions.ts';
import {ranked,levels,type Diagnosis} from '../shared/scoring.ts';
import {approvedResultTexts,pillarGuidance,resultIntro} from './results.ts';
import {escapeHtml as e} from './ui.ts';

export type ResultContext={
 answers:Record<string,boolean>;
 comments:Partial<Record<PillarId,string>>;
 challenge:string;
};

function signals(id:PillarId,context:ResultContext,value:boolean){
 const index=pillars.findIndex(p=>p.id===id);
 return pillars[index].questions.flatMap((question,i)=>context.answers[questionId(index,i)]===value
  ?[{question,text:(value?pillarGuidance[id].strengths:pillarGuidance[id].attention)[i]}]:[]);
}
function list(items:readonly string[],className=''){return `<ul class="${className}">${items.map(text=>`<li>${e(text)}</li>`).join('')}</ul>`;}
function contextNote(id:PillarId,context:ResultContext){
 const comment=context.comments[id]?.trim();
 return comment?`<div class="own-context"><span class="eyebrow">O CONTEXTO QUE VOCÊ COMPARTILHOU</span><p class="user-text">${e(comment)}</p><small>Suas palavras, preservadas como contexto para a reflexão.</small></div>`:'';
}
function overview(result:Diagnosis,context:ResultContext){
 return ranked(result).map(p=>{
  const count=result.counts[p.id],attention=signals(p.id,context,false),strengths=signals(p.id,context,true);
  return `<article class="result-card"><details><summary>
   <span class="result-card-name">${e(p.name)}</span><span class="level level-${count}">${e(levels[count])}</span>
   <span class="card-measure"><span class="count">${count} de 3 “Não”</span><span class="count-blocks" aria-hidden="true">${[1,2,3].map(n=>`<span class="${n<=count?'filled':''}"></span>`).join('')}</span></span>
   <span class="card-expand">Ver suas respostas <span aria-hidden="true">+</span></span></summary>
   <div class="card-reading">
    ${attention.length?`<h4>Pontos que você sinalizou</h4>${list(attention.map(s=>s.text))}`:''}
    ${strengths.length?`<h4>O que aparece como base</h4>${list(strengths.map(s=>s.text))}`:''}
    <h4>Suas respostas nesta área</h4><ol class="answer-review">${p.questions.map((question,i)=>`<li><span>${e(question)}</span><strong>${context.answers[questionId(pillars.findIndex(item=>item.id===p.id),i)]?'Sim':'Não'}</strong></li>`).join('')}</ol>
    ${contextNote(p.id,context)}
   </div></details></article>`;
 }).join('');
}
function interpretation(id:PillarId,index:number,result:Diagnosis,context:ResultContext){
 const p=pillars.find(p=>p.id===id)!,guidance=pillarGuidance[id],paragraphs=approvedResultTexts[id].split('\n\n');
 const attention=signals(id,context,false);
 return `<article class="priority-reading" aria-labelledby="reading-${id}">
  <header class="reading-heading"><span class="reading-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><div><span class="eyebrow">UM OLHAR PARA · ${e(p.name)}</span><h2 id="reading-${id}">${e(guidance.headline)}</h2><span class="level level-${result.counts[id]}">${e(levels[result.counts[id]])} · ${result.counts[id]} de 3 “Não”</span></div></header>
  <p class="reading-lead">${e(paragraphs[0])}</p><p>${e(paragraphs[1])}</p>
  <section class="attention-points"><h3>O que suas respostas colocam em foco</h3><p class="section-note">Estes pontos correspondem às perguntas em que você respondeu “Não”.</p>${list(attention.map(s=>s.text))}</section>
  <div class="reading-impact"><span class="eyebrow">POR QUE OLHAR PARA ISSO</span><p>${e(paragraphs[2])}</p></div>
  <section class="first-steps"><h3>Um primeiro movimento com a liderança</h3><p class="section-note">Uma sugestão de conversa para adaptar à realidade da sua igreja.</p><ol>${guidance.firstSteps.map(text=>`<li>${e(text)}</li>`).join('')}</ol></section>
  <blockquote class="leadership-reflection"><span class="eyebrow">PARA LEVAR À LIDERANÇA</span><p class="reflection-intro">${e(paragraphs[3])}</p><p class="reflection-question">${e(paragraphs[4])}</p></blockquote>
  ${paragraphs.slice(5).map(text=>`<p class="reading-footer">${e(text)}</p>`).join('')}
 </article>`;
}
export function renderResultBody(result:Diagnosis,context:ResultContext):string{
 const priority=result.priority_pillars.map(id=>pillars.find(p=>p.id===id)!);
 return `<div class="result-heading"><div><span class="eyebrow">SEU RAIO-X REVITALIZE</span><h1 tabindex="-1">Clareza para<br><em>seguir em frente.</em></h1></div><span class="result-stamp" aria-hidden="true">r↗</span></div>
 <p class="result-welcome">Olhar com honestidade para a realidade da igreja já é um passo de cuidado com ela.</p><p class="result-intro">${e(resultIntro)}</p>
 <section class="priority-summary"><span class="eyebrow">${priority.length>1?'PRINCIPAIS ÁREAS DE ATENÇÃO':priority.length===1?'PRINCIPAL ÁREA DE ATENÇÃO':'UM PONTO DE PARTIDA CONSISTENTE'}</span><h2>${priority.length?priority.map(p=>e(p.name)).join(' · '):'Base consistente nas seis áreas'}</h2><p>${priority.length>1?'Estas áreas tiveram a mesma quantidade de respostas “Não”. Todas recebem o mesmo destaque.':priority.length?'Esta área concentrou a maior quantidade de respostas “Não”.':'Você respondeu “Sim” às 18 perguntas. Nenhum pilar se destacou como área de atenção neste diagnóstico.'}</p><p class="summary-direction">${priority.length?'Use os destaques para abrir uma conversa. Você e sua liderança podem escolher por onde começar, considerando a realidade da igreja.':'Preservar uma boa base também exige atenção. O convite agora é cuidar do que já está funcionando e continuar ouvindo sua liderança.'}</p></section>
 <section class="report-overview" aria-labelledby="overview-title"><div class="report-section-heading"><span class="eyebrow">01 · O PANORAMA</span><h2 id="overview-title">As seis áreas da sua igreja</h2><p>Abra cada área para rever suas respostas, os pontos de atenção e as bases que você reconhece.</p></div><div class="result-grid">${overview(result,context)}</div><p class="classification-note">Como ler: 0 “Não” = Base consistente · 1 = Ponto de atenção · 2 = Atenção relevante · 3 = Prioridade. O destaque reúne todas as áreas com a maior contagem de “Não”, quando houver.</p></section>
 ${priority.length?`<div class="report-section-heading reading-section-title"><span class="eyebrow">02 · APROFUNDANDO A REFLEXÃO</span><h2>Onde vale concentrar a conversa</h2><p>As sugestões abaixo ajudam a iniciar uma reflexão. A leitura das respostas não substitui o conhecimento da sua liderança sobre a igreja.</p></div>`:''}
 <section class="interpretations">${priority.map((p,i)=>interpretation(p.id,i,result,context)).join('')}</section>
 ${!priority.length?`<section class="consistent-reading"><span class="eyebrow">02 · CUIDANDO DA BASE</span><h2>Uma base consistente merece ser cultivada.</h2><p>Suas respostas apontam consistência nos seis pilares avaliados. Esse retrato se refere às perguntas deste diagnóstico e ao modo como você percebe a igreja hoje.</p><h3>Uma conversa para continuar caminhando</h3>${list(['Conversem sobre quais práticas ajudam a sustentar essa base hoje.','Escutem se outros líderes reconhecem a mesma realidade nas seis áreas.','Escolham uma prática que desejam preservar e combinem quando voltarão a avaliá-la.'])}</section>`:''}
 ${context.challenge.trim()?`<section class="challenge-reading" aria-labelledby="challenge-title"><span class="eyebrow">03 · OLHANDO PARA OS PRÓXIMOS 90 DIAS</span><h2 id="challenge-title">O desafio que você quer enfrentar</h2><p>Quando perguntamos qual problema você gostaria de resolver primeiro, você escreveu:</p><blockquote class="user-text">${e(context.challenge.trim())}</blockquote><h3>Transforme essa intenção em uma conversa concreta</h3>${list(['Como esse desafio se relaciona com o panorama que você acabou de ver?','Qual primeiro passo cabe na realidade da igreja neste momento?','Quem pode caminhar com você e quando vocês vão rever o andamento?'])}<p class="section-note">Este texto é a sua própria resposta. Nenhuma interpretação automática dos campos abertos foi usada para definir as classificações.</p></section>`:''}`;
}
