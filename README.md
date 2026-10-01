# Raio-X Revitalize

Aplicação independente em Vite + TypeScript + HTML/CSS, preparada para Vercel, Supabase PostgreSQL, Auth e Edge Functions.

## Estado da entrega

Questionário, resultado, captura, painel, migração e função de envio implementados. Devolutivas fornecidas e aprovadas pelo usuário, preservadas em src/results.ts.

Nenhum serviço externo foi provisionado e nenhum cadastro real foi criado. Para receber dados reais, configure Supabase, Turnstile, política e domínio. Não há dados fictícios no aplicativo nem seed de produção. Os testes usam dados sintéticos em memória ou respostas HTTP simuladas.

## Rodar localmente

Requer Node.js 22.13+ e npm.

~~~bash
npm ci
npm run dev
~~~

Copie .env.example para .env.local. Para experimentar sem backend, configure VITE_DEMO_MODE=true. Abra http://127.0.0.1:5178.

A prévia mostra aviso visível, não envia dados e só funciona em desenvolvimento. Uma compilação de produção nunca habilita simulação, mesmo se a variável for true.

Para usar o backend real, preencha as variáveis públicas e configure VITE_DEMO_MODE=false.

## Arquitetura

| Arquivo | Responsabilidade |
|---|---|
| shared/questions.ts | Perguntas, comentários, funções, tamanhos e estados |
| shared/scoring.ts | Classificação, prioridades e empates |
| shared/validation.ts | Validação usada pela função server-side |
| src/results.ts | Devolutivas aprovadas e fechamento |
| src/main.ts | Composição das telas e navegação |
| src/storage.ts | Rascunho local e UTMs |
| src/supabase.ts | Cliente público, Auth e chamada à Edge Function |
| src/analytics.ts | Eventos genéricos internos |
| src/turnstile.ts | CAPTCHA e renovação de token |
| src/admin.ts | Login, indicadores, filtros, detalhes, CSV e PDF |
| src/csv.ts | Exportação protegida contra fórmulas |
| src/admin-pdf.ts | PDF paginado do relatório filtrado e diagnóstico individual |
| supabase/functions/diagnostic/index.ts | Entrada pública segura |
| supabase/migrations/ | Schema, RLS, transação e relatórios |
| tests/ | Testes de domínio, SQL e navegador |
| docs/ | Implantação, operação e integrações |

Mantenha a estrutura de pastas no deploy: a função importa os módulos compartilhados.

## Classificação

| Respostas “Não” | Classificação |
|---|---|
| 0 | Base consistente |
| 1 | Ponto de atenção |
| 2 | Atenção relevante |
| 3 | Prioridade |

Pilares principais: todos os empatados na maior contagem positiva, com todas as devolutivas correspondentes. Isso é diferente do rótulo “Prioridade”, reservado a três respostas “Não”.

Se todas forem “Sim”, não há pilar principal nem devolutiva que indique dificuldade: o resultado mostra base consistente nas seis áreas e o fechamento geral.

Secundários: todos os pilares com algum “Não” e contagem menor que a maior. A ordem original dentro dos empates serve apenas para exibição.

## Fluxo de dados

1. A função cria uma sessão de início sem contato, respostas ou textos, com hash de token aleatório.
2. Até a conclusão, respostas e comentários permanecem somente no dispositivo.
3. A função valida cadastro, consentimentos, origem, CAPTCHA e limites.
4. Uma única transação salva lead, submissão, 18 respostas e eventual item na fila de marketing.
5. O servidor recalcula o resultado, que é mostrado ao participante.
6. Administradores acessam /admin por Supabase Auth e autorização explícita em admin_users.

O acesso não é concedido a qualquer usuário autenticado. A RLS consulta a autorização atual no banco, inclusive após revogação.

Cada conclusão cria seu próprio lead. E-mails repetidos não misturam respostas. A sessão garante idempotência: repetir um envio retorna o resultado persistido sem duplicar registros.

Os comentários são armazenados em answers.comment na primeira pergunta de cada pilar; nas outras duas, são nulos. O desafio fica em submissions.challenge_90_days.

UTMs usam a primeira página da sessão e sessionStorage. Referrer guarda apenas a origem, sem caminho ou parâmetros. Valores UTM têm limite de 200 caracteres.

## Painel

Indicadores de início, conclusão, taxa e marketing; distribuições por pilar, função, tamanho, cidade/estado e origem; filtros; paginação; detalhes completos; CSV e PDF de todos os resultados filtrados. O diagnóstico individual também possui exportação PDF com todas as respostas e comentários. A geração usa pdf-lib no navegador, carregada apenas ao exportar, e o logotipo local; não há serviço externo de conversão.

Taxa = sessões concluídas / sessões iniciadas na mesma coorte. Período padrão: 30 dias. Filtros de perfil afetam leads e distribuições, não o denominador anônimo. Empates contam em cada pilar, portanto a soma da distribuição pode exceder o total de diagnósticos.

Não há envio de progresso por pilar ao servidor antes do consentimento. A versão atual mede inícios e conclusões, não a etapa exata de abandono.

## Segurança e analytics

- Sem leitura/escrita pública de dados pessoais.
- Service role somente na Edge Function.
- Funções de gravação são invoker e executáveis apenas por service role.
- View administrativa usa security_invoker=true.
- Transação única e validação autoritativa.
- Honeypot, tempo mínimo, rate limit por IP pseudonimizado e Turnstile.
- CAPTCHA validado por sucesso, hostname e action.
- CORS explícito e cabeçalhos de segurança na Vercel.
- Saída HTML escapada; CSV neutraliza fórmulas.
- Sessão administrativa em sessionStorage.
- Nenhum payload pessoal registrado pelo código nos logs.

Eventos: quiz_view, quiz_start, pillar_complete, contact_submit, quiz_complete, result_view e result_cta_click.

A camada emite somente CustomEvent('revitalize:analytics') com {event}. Não aceita contato, identificadores, respostas, texto, pilar, religião, UTMs ou resultado. GTM, Meta Pixel, captura automática e envio externo estão desabilitados. A rota admin não dispara eventos.

## Configuração

- [Supabase, Vercel e domínio](docs/DEPLOY.md)
- [Privacidade, retenção e exclusão](docs/OPERACAO.md)
- [E-mail e automações futuras](docs/AUTOMACOES.md)

## Verificação

~~~bash
npm run build
npm test
npm run test:e2e
npm run test:production
npm audit
~~~

Os testes de navegador usam Chrome instalado. Para usar Chromium, instale-o pelo Playwright e retire channel: 'chrome' da configuração.

Os testes SQL executam PostgreSQL via PGlite em memória, com roles e auth.uid() simulados. Cobrem migração, RLS, permissões, transação, idempotência e relatórios; não substituem a verificação na instância Supabase real.

Antes da abertura, faça um cadastro de teste autorizado no ambiente real, confira todos os dados e elimine o teste administrativamente. Compilação local não comprova deploy nem integração externa.


A prévia visual vazia do painel fica em /admin?preview=1 somente no modo de desenvolvimento com VITE_DEMO_MODE=true. A rota não remove a autenticação no build de produção.
