export const pillars = [
 {id:'vision', name:'Visão', short:'Visão', description:'Uma direção compartilhada para caminhar juntos.', questions:[
 'Sua igreja possui uma direção clara para os próximos anos?',
 'A liderança da sua igreja compreende e compartilha essa direção?',
 'As principais decisões, ministérios e atividades da igreja estão alinhados com essa direção?'],
 comment:'Conte um pouco sobre a realidade da sua igreja nessa área. O que hoje mais dificulta ter ou manter uma direção clara?'},
 {id:'diagnosis', name:'Diagnóstico interno e externo', short:'Diagnóstico', description:'Um olhar atento para a igreja e para a comunidade.', questions:[
 'Sua liderança conhece com clareza os principais pontos fortes e fragilidades atuais da igreja?',
 'Sua igreja conhece bem as necessidades, mudanças e características da comunidade onde está inserida?',
 'As decisões importantes da igreja costumam ser tomadas a partir de uma análise da realidade interna e externa?'],
 comment:'Existe hoje alguma situação dentro da igreja ou na comunidade ao redor que você acredita que precisa ser melhor compreendida?'},
 {id:'simplification', name:'Simplificação Ministerial', short:'Simplificação', description:'Propósito, foco e cuidado com quem serve.', questions:[
 'Os ministérios e atividades atuais da igreja possuem um propósito claramente definido?',
 'A liderança avalia periodicamente se os programas e atividades ainda contribuem para a missão da igreja?',
 'A quantidade de ministérios e atividades é compatível com a capacidade atual dos líderes e voluntários?'],
 comment:'Há algum ministério, programa ou atividade que hoje consome muita energia e parece produzir pouco resultado? Conte um pouco.'},
 {id:'discipleship', name:'Discipulado', short:'Discipulado', description:'Crescimento na fé que se multiplica em outras vidas.', questions:[
 'Sua igreja possui um caminho claro para ajudar uma pessoa a crescer como discípulo de Cristo?',
 'As pessoas que chegam à igreja recebem acompanhamento durante seu processo de amadurecimento na fé?',
 'Sua igreja consegue formar discípulos que depois passam a acompanhar e discipular outras pessoas?'],
 comment:'Qual é hoje a principal dificuldade da sua igreja no processo de formação e multiplicação de discípulos?'},
 {id:'change', name:'Processos de Mudança', short:'Mudança', description:'Discernimento e clareza para dar os próximos passos.', questions:[
 'Sua liderança consegue identificar quando mudanças importantes se tornam necessárias?',
 'Quando uma mudança precisa acontecer, ela é comunicada de maneira clara para a igreja?',
 'Sua igreja consegue implementar mudanças necessárias sem que a resistência paralise o processo?'],
 comment:'Existe alguma mudança que sua igreja precisa fazer hoje, mas encontra dificuldade para colocar em prática? Qual?'},
 {id:'conflict', name:'Gestão de Conflitos', short:'Conflitos', description:'Verdade, relacionamentos e unidade no mesmo caminho.', questions:[
 'Os conflitos e divergências são tratados diretamente pela liderança, em vez de serem apenas adiados?',
 'Sua liderança consegue lidar com oposição e discordâncias sem transformar todo conflito em ruptura?',
 'Os conflitos são conduzidos buscando preservar a verdade, os relacionamentos e a unidade da igreja?'],
 comment:'Existe algum tipo de conflito ou resistência que hoje mais desgasta a liderança da sua igreja? Conte um pouco.'}
] as const;
export type PillarId = typeof pillars[number]['id'];
export const roles = ['Pastor titular','Pastor auxiliar','Presbítero','Líder de ministério','Outro'] as const;
export const churchSizes = ['Até 50 pessoas','51 a 100','101 a 250','251 a 500','Mais de 500'] as const;
export const states = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
export const questionId = (pillarIndex:number, index:number) => String(pillarIndex * 3 + index + 1);
