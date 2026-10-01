import test from 'node:test';
import assert from 'node:assert/strict';
import {score} from '../shared/scoring.ts';
import {pillars} from '../shared/questions.ts';
import {renderResultBody,type ResultContext} from '../src/result-view.ts';
import {approvedResultTexts,pillarGuidance} from '../src/results.ts';
import {escapeHtml} from '../src/ui.ts';
const context=():ResultContext=>({answers:Object.fromEntries(Array.from({length:18},(_,i)=>[String(i+1),true])),comments:{},challenge:'Cuidar do acompanhamento.'});

test('devolutiva detalha apenas os Não reais e mantém os Sim como base',()=>{
 const c=context();c.answers['2']=false;
 const r=score(c.answers),html=renderResultBody(r,c);
 assert.deepEqual(r.priority_pillars,['vision']);
 const reading=html.split('<section class="interpretations">')[1].split('</article>')[0];
 assert.ok(reading.includes(pillarGuidance.vision.attention[1]));
 assert.ok(!reading.includes(pillarGuidance.vision.attention[0]));
 assert.ok(!reading.includes(pillarGuidance.vision.attention[2]));
 assert.ok(html.includes(pillarGuidance.vision.strengths[0]));
 assert.ok(html.includes(pillarGuidance.vision.strengths[2]));
 for(const paragraph of approvedResultTexts.vision.split('\n\n'))assert.ok(reading.includes(escapeHtml(paragraph)));
});

test('todas as áreas empatadas recebem a mesma estrutura completa, mesmo com apenas um Não',()=>{
 const c=context();pillars.forEach((_,i)=>{c.answers[String(i*3+1)]=false;});
 const r=score(c.answers),html=renderResultBody(r,c);
 assert.equal(r.priority_pillars.length,6);
 assert.equal((html.match(/class="priority-reading"/g)||[]).length,6);
 assert.equal((html.match(/class="first-steps"/g)||[]).length,6);
 for(const p of pillars){
  assert.ok(html.includes('id="reading-'+p.id+'"'));
  for(const paragraph of approvedResultTexts[p.id].split('\n\n'))assert.ok(html.includes(escapeHtml(paragraph)));
 }
 assert.ok(html.includes('Todas recebem o mesmo destaque.'));
});

test('todas Sim preserva o caso consistente e não inventa devolutivas de dificuldade',()=>{
 const c=context(),r=score(c.answers),html=renderResultBody(r,c);
 assert.deepEqual(r.priority_pillars,[]);
 assert.ok(html.includes('Base consistente nas seis áreas'));
 assert.ok(!html.includes('class="priority-reading"'));
 assert.ok(html.includes('class="consistent-reading"'));
 assert.equal((html.match(/class="result-card"/g)||[]).length,6);
});

test('textos livres são escapados, identificados como palavras do participante e não afetam o diagnóstico',()=>{
 const c=context(),before=score(c.answers);
 c.comments.vision='<img src=x onerror=alert(1)>';
 c.challenge='<script>alert("desafio")</script>\n& reflexão';
 const html=renderResultBody(score(c.answers),c);
 assert.deepEqual(score(c.answers),before);
 assert.ok(!html.includes('<script>'));
 assert.ok(!html.includes('<img src=x'));
 assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
 assert.ok(html.includes('&lt;script&gt;alert(&quot;desafio&quot;)&lt;/script&gt;'));
 assert.ok(html.includes('Suas palavras, preservadas como contexto'));
 assert.ok(html.includes('Nenhuma interpretação automática dos campos abertos'));
});
