import type { PillarId } from '../shared/questions.ts';
export const approvedResultTexts: Record<PillarId,string> = {
vision: [
'Seu principal ponto de atenção parece estar na clareza de visão.',
'Suas respostas sugerem que pode existir espaço para tornar mais clara a direção da igreja e fortalecer o alinhamento da liderança em torno dela.',
'Quando a visão não está suficientemente compreendida, diferentes ministérios podem trabalhar bastante, mas nem sempre caminhar na mesma direção.',
'Uma boa reflexão para sua liderança é:',
'Se perguntássemos hoje a cinco líderes para onde nossa igreja está caminhando, receberíamos respostas semelhantes?',
'Este é um dos temas trabalhados pelo Revitalize e continuaremos produzindo conteúdos para ajudar pastores e líderes a aprofundarem essa reflexão.'
].join('\n\n'),
diagnosis: [
'Seu principal ponto de atenção parece estar na leitura da realidade da igreja.',
'Suas respostas sugerem que algumas decisões podem estar sendo tomadas sem uma visão suficientemente clara do cenário interno da igreja e da comunidade ao seu redor.',
'Antes de decidir o que mudar, é importante entender o que realmente está acontecendo.',
'Uma pergunta útil é:',
'Quais fatos mostram hoje onde nossa igreja está saudável e onde estamos apenas supondo que esteja?',
'O Revitalize continuará trazendo ferramentas para ajudar líderes a observar melhor sua realidade antes de definir novos caminhos.'
].join('\n\n'),
simplification: [
'Seu principal ponto de atenção parece estar na organização e simplificação dos ministérios.',
'Suas respostas podem indicar que a igreja mantém atividades, programas ou estruturas que precisam ser reavaliados à luz da missão atual.',
'Simplificar não significa necessariamente fazer menos. Significa concentrar energia naquilo que realmente contribui para aquilo que a igreja foi chamada a fazer.',
'Uma boa pergunta para começar é:',
'Se tivéssemos que iniciar nossa igreja novamente hoje, quais atividades criaríamos de novo e quais provavelmente não criaríamos?'
].join('\n\n'),
discipleship: [
'Seu principal ponto de atenção parece estar no processo de discipulado.',
'Suas respostas sugerem que pode haver oportunidade para tornar mais claro como uma pessoa é acompanhada, amadurece na fé e passa a ajudar outros discípulos.',
'Uma igreja pode possuir muitos programas e ainda assim precisar fortalecer seu processo de formação de pessoas.',
'Três perguntas podem ajudar:',
'Como uma pessoa começa hoje sua jornada de discipulado? Quem a acompanha? Em que momento ela começa a discipular outra pessoa?'
].join('\n\n'),
change: [
'Seu principal ponto de atenção parece estar na condução de mudanças.',
'Suas respostas sugerem que a igreja pode reconhecer a necessidade de mudanças, mas encontrar dificuldades para conduzi-las sem gerar resistência excessiva ou perda de alinhamento.',
'Mudanças necessárias nem sempre são mudanças fáceis.',
'Uma questão importante para sua liderança é:',
'As pessoas estão resistindo à mudança em si ou à maneira como a mudança está sendo conduzida e comunicada?'
].join('\n\n'),
conflict: [
'Seu principal ponto de atenção parece estar na gestão de conflitos.',
'Suas respostas sugerem que divergências, oposições ou situações difíceis podem estar consumindo energia da liderança ou afetando a unidade da igreja.',
'Conflitos fazem parte da vida comunitária. O ponto central é como eles são compreendidos e conduzidos.',
'Uma pergunta útil para reflexão é:',
'Nossos conflitos estão sendo tratados de forma clara e madura ou apenas adiados até que se tornem maiores?'
].join('\n\n')
};
export const resultIntro='Esta é uma leitura inicial baseada nas suas respostas. Use este retrato como ponto de partida para uma conversa com sua liderança.';
export const resultClosing='Continue acompanhando o Revitalize. A partir dos resultados deste diagnóstico, estamos preparando novos conteúdos e ferramentas para ajudar pastores e líderes a enfrentarem esses desafios de forma prática.';
