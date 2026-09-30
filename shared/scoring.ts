import { pillars, type PillarId } from './questions.ts';
export const levels = ['Base consistente','Ponto de atenção','Atenção relevante','Prioridade'] as const;
export type Counts = Record<PillarId, number>;
export type Diagnosis = {counts:Counts; priority_pillars:PillarId[]; secondary_pillars:PillarId[]};
export function summarize(counts:Counts):Diagnosis {
 for (const p of pillars) if (!Number.isInteger(counts[p.id]) || counts[p.id]<0 || counts[p.id]>3) throw new Error('Contagem inválida.');
 const max = Math.max(...Object.values(counts));
 const priority_pillars = max === 0 ? [] : pillars.filter(p=>counts[p.id]===max).map(p=>p.id);
 // Secundários = todos os pilares com algum Não, abaixo da maior contagem.
 const secondary_pillars = pillars.filter(p=>counts[p.id]>0 && counts[p.id]<max).map(p=>p.id);
 return {counts,priority_pillars,secondary_pillars};
}
export function score(answers:Record<string,boolean>):Diagnosis {
 const counts = {} as Counts;
 if (Object.keys(answers).length !== 18) throw new Error('Responda às 18 perguntas.');
 pillars.forEach((p,i)=>{ counts[p.id]=0; for(let j=1;j<=3;j++){
 const value=answers[String(i*3+j)]; if(typeof value!=='boolean') throw new Error('Resposta inválida.');
 if(!value) counts[p.id]++;
 }});
 return summarize(counts);
}
export function ranked(result:Diagnosis) {
 // Ordem original apenas para exibição dentro dos empates; não é desempate.
 return [...pillars].sort((a,b)=>result.counts[b.id]-result.counts[a.id]);
}
