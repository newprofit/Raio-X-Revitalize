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

export type PillarGuidance = {
 headline:string;
 attention:readonly [string,string,string];
 strengths:readonly [string,string,string];
 firstSteps:readonly [string,string,string];
};
export const pillarGuidance:Record<PillarId,PillarGuidance> = {
 vision:{
 headline:'Uma direção clara ajuda a igreja a caminhar junto.',
 attention:['Tornar mais clara a direção da igreja para os próximos anos.','Fortalecer a compreensão e o compromisso da liderança com essa direção.','Conectar decisões, ministérios e atividades à direção da igreja.'],
 strengths:['Você reconhece uma direção clara para os próximos anos.','Você percebe a liderança alinhada em torno dessa direção.','Você percebe decisões e atividades conectadas à direção da igreja.'],
 firstSteps:['Reúna alguns líderes e peça que cada um descreva, com suas próprias palavras, para onde a igreja está caminhando.','Comparem as respostas e conversem sobre os pontos de clareza e as diferenças de entendimento.','Registrem uma direção comum e escolham uma decisão concreta que precisa ser alinhada a ela.']
 },
 diagnosis:{
 headline:'Compreender a realidade ajuda a escolher o próximo passo.',
 attention:['Reconhecer com mais clareza os pontos fortes e as fragilidades da igreja.','Conhecer melhor as necessidades e as mudanças da comunidade ao redor.','Apoiar decisões importantes numa leitura da realidade interna e externa.'],
 strengths:['Você percebe clareza sobre os pontos fortes e as fragilidades da igreja.','Você reconhece um conhecimento das necessidades da comunidade ao redor.','Você percebe decisões apoiadas numa análise da realidade.'],
 firstSteps:['Escolham uma situação que hoje precisa ser melhor compreendida.','Reúnam fatos disponíveis e escutem as pessoas envolvidas, incluindo a comunidade quando fizer sentido.','Separem o que já sabem do que ainda precisam descobrir antes de decidir.']
 },
 simplification:{
 headline:'Muita atividade nem sempre significa clareza de missão.',
 attention:['Tornar mais claro o propósito de cada ministério e atividade.','Reavaliar se os programas continuam contribuindo para a missão da igreja.','Ajustar as demandas à capacidade atual de líderes e voluntários.'],
 strengths:['Você percebe um propósito claro nos ministérios e nas atividades.','Você reconhece uma avaliação periódica da contribuição dos programas.','Você percebe as demandas compatíveis com a capacidade da equipe.'],
 firstSteps:['Escolham uma atividade que hoje exige muita energia da equipe.','Conversem sobre seu propósito, sua contribuição para a missão e a capacidade de sustentá-la.','Registrem um ajuste possível e combinem quando vão avaliar o efeito desse ajuste.']
 },
 discipleship:{
 headline:'O discipulado ganha força quando o caminho se torna claro.',
 attention:['Definir com mais clareza o caminho de crescimento como discípulo de Cristo.','Fortalecer o acompanhamento de quem chega à igreja.','Ajudar discípulos a amadurecer e começar a discipular outras pessoas.'],
 strengths:['Você reconhece um caminho claro de crescimento como discípulo de Cristo.','Você percebe acompanhamento de quem chega à igreja.','Você reconhece discípulos que passam a acompanhar outras pessoas.'],
 firstSteps:['Descrevam o caminho que uma pessoa percorre hoje, desde sua chegada à igreja até acompanhar outra pessoa.','Identifiquem em que etapa o acompanhamento fica menos claro e quem pode cuidar dela.','Escolham uma melhoria nessa etapa e combinem como acompanhar sua implementação.']
 },
 change:{
 headline:'Uma mudança necessária precisa de uma condução cuidadosa.',
 attention:['Reconhecer quando mudanças importantes se tornam necessárias.','Comunicar com mais clareza as mudanças que a igreja precisa fazer.','Conduzir mudanças sem que a resistência paralise o processo.'],
 strengths:['Você percebe a liderança capaz de reconhecer mudanças necessárias.','Você reconhece uma comunicação clara das mudanças.','Você percebe capacidade de implementar mudanças mesmo diante de resistência.'],
 firstSteps:['Escolham uma mudança necessária e descrevam juntos por que ela importa.','Escutem as dúvidas das pessoas envolvidas e revisem como a mudança está sendo comunicada.','Definam um primeiro passo viável, quem o acompanha e quando a liderança vai rever o andamento.']
 },
 conflict:{
 headline:'A maneira de conduzir um conflito também cuida da unidade.',
 attention:['Tratar conflitos diretamente, em vez de apenas adiá-los.','Lidar com discordâncias sem transformar todo conflito em ruptura.','Conduzir conflitos preservando a verdade, os relacionamentos e a unidade.'],
 strengths:['Você percebe a liderança tratando conflitos diretamente.','Você reconhece capacidade de lidar com discordâncias sem ruptura.','Você percebe cuidado com a verdade, os relacionamentos e a unidade.'],
 firstSteps:['Identifiquem uma divergência que precisa de uma conversa clara, evitando expor pessoas publicamente.','Preparem a conversa com escuta, fatos e clareza sobre o que precisa ser tratado.','Combinem um encaminhamento possível e uma forma de acompanhar os relacionamentos envolvidos.']
 }
};
