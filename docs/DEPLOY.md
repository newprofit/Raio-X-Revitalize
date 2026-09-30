# Supabase, Vercel e domínio

## 1. Projeto Supabase dedicado

Escolha explicitamente um projeto destinado ao Raio-X Revitalize. Não aplique esta migração em outro produto. Plano e custo devem ser escolhidos pelo responsável pela conta.

No diretório do projeto:

~~~bash
npx supabase login
npx supabase link --project-ref [PREENCHER]
npx supabase db push --dry-run
npx supabase db push
~~~

Alternativamente, execute a migração no SQL Editor, mantendo o histórico consistente. Escolha um método. Nenhum usuário ou contato fictício está na migração.

Tabelas: leads, submissions, answers, admin_users, quiz_sessions, rate_limits e marketing_outbox.

## 2. Conta administrativa

No Supabase Auth, desabilite cadastro público e anonymous sign-ins. Crie a conta da equipe por interface segura. Não coloque senhas no código.

Copie o UUID real do usuário:

~~~sql
insert into public.admin_users(user_id) values ('[UUID_REAL_DO_ADMIN]');
~~~

Para revogar o acesso:

~~~sql
delete from public.admin_users where user_id='[UUID_REAL_DO_ADMIN]';
~~~

Revogue também as sessões no Auth. Usuários comuns não podem se promover nem escrever pelas APIs de tabela.

Configure senha forte e proteção de login no Supabase Auth. A interface atual implementa login por senha; adoção de MFA exige acrescentar o fluxo de desafio antes de torná-lo obrigatório.

## 3. Turnstile e segredos

Cadastre um widget Cloudflare Turnstile com hostnames exatos de produção/homologação. Prefira chaves de teste separadas.

Copie supabase/.env.example para supabase/.env.local, ignorado pelo Git. Preencha:

| Segredo | Descrição |
|---|---|
| ALLOWED_ORIGINS | Origens exatas com protocolo, separadas por vírgula e sem barra final |
| TURNSTILE_SECRET_KEY | Segredo do widget, apenas servidor |
| TURNSTILE_HOSTNAMES | Hostnames permitidos, sem protocolo/porta |
| RATE_LIMIT_SALT | Segredo aleatório de pelo menos 32 bytes |
| TRUSTED_IP_HEADER | Padrão x-forwarded-for, usando o último IP |
| PRIVACY_POLICY_URL | URL HTTPS da política aprovada |

Para homologação local, a origem é http://127.0.0.1:5178. Nunca use *.

Verifique o cabeçalho de IP na infraestrutura real: o proxy deve sobrescrever ou acrescentar o IP verdadeiro. Não aceite um cabeçalho controlável pelo solicitante. A função falha fechada quando ele está ausente. Limites: 30 inícios/hora e 15 tentativas de envio/hora por IP pseudonimizado. Não há IP armazenado em texto claro.

SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são disponibilizados pelo Supabase na função. Nunca coloque service role, salt ou segredo Turnstile em VITE_*, no repositório ou na Vercel frontend.

~~~bash
npx supabase secrets set --env-file supabase/.env.local
npx supabase functions deploy diagnostic --use-api
~~~

A função pública usa verify_jwt=false no config.toml: participantes não precisam de login. CAPTCHA, validação, CORS e rate limit protegem o envio; grants e RLS impedem acesso aos dados. Credenciais ausentes não têm fallback fictício.

## 4. Variáveis públicas

Preencha na Vercel e no .env.local de homologação:

| Variável | Valor |
|---|---|
| VITE_SUPABASE_URL | URL do projeto escolhido |
| VITE_SUPABASE_PUBLISHABLE_KEY | Publishable key, nunca secret/service role |
| VITE_TURNSTILE_SITE_KEY | Chave pública do widget |
| VITE_PRIVACY_POLICY_URL | Mesma política HTTPS do servidor |
| VITE_RESULT_CTA_URL | URL real opcional do Revitalize |
| VITE_RESULT_CTA_LABEL | Rótulo opcional do CTA |
| VITE_DEMO_MODE | false |

Sem URL do CTA, o sistema não inventa link. Mantém a ação de salvar/imprimir o resultado.

## 5. Vercel

1. Envie a pasta a um repositório escolhido pelo responsável.
2. Importe o repositório na Vercel.
3. Root Directory: raio-x-revitalize se estiver no repositório atual; raiz se for repositório dedicado.
4. Framework: Vite. Build: npm run build. Output: dist. Install: npm ci.
5. Node.js 22 ou 24 compatível com as dependências.
6. Configure variáveis e faça deploy.
7. Teste /, /privacidade e /admin diretamente e após recarga.
8. Cadastre a origem de homologação no CORS e Turnstile.

Somente dist é publicado. SQL, testes, segredos e código da função não devem ser servidos estaticamente. O rewrite e os cabeçalhos estão no vercel.json.

## 6. Domínio

Na Vercel, Settings → Domains: adicione o domínio/subdomínio aprovado. No provedor DNS, crie exatamente os registros A/CNAME indicados pela Vercel. Não invente IP ou destino.

Após validação DNS e certificado:

- Atualize ALLOWED_ORIGINS e TURNSTILE_HOSTNAMES.
- Atualize o widget Turnstile.
- Ajuste Site URL e Redirect URLs no Supabase Auth.
- Confira política e CTA.
- Se usar domínio próprio para a API Supabase, ajuste connect-src no CSP.
- Faça novo build ao alterar VITE_*.
- Teste HTTPS, login e envio real.

## 7. Validação externa necessária

Aplique a migração e rode os advisors Supabase. Confirme que anon não lê dados, usuário comum não acessa o painel e administrador autorizado consulta resultados.

Envie um diagnóstico real de teste autorizado, confirme as 18 respostas, os seis comentários, desafio, UTMs e consentimentos. Repetir a mesma sessão deve produzir uma única submissão.

Teste CAPTCHA inválido, origem não autorizada, falha de rede, retomada e exclusão do cadastro de teste. Confirme o cabeçalho de IP confiável e configure a manutenção diária indicada em OPERACAO.md.

## Referências oficiais

- [RLS e views](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions/auth)
- [Validação Turnstile](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite)
