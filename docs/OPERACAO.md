# Privacidade e operação

## Política antes da ativação

A página /privacidade explica o funcionamento. Ela não substitui uma política jurídica nem inventa dados do controlador. Para ativar o envio, publique uma política que identifique:

- Controlador: [PREENCHER]
- Contato para privacidade: [PREENCHER]
- Finalidade e fundamento aplicável: [PREENCHER]
- Tratamento de dados que podem revelar vínculo/convicção religiosa.
- Operadores e transferências aplicáveis: [PREENCHER]
- Retenção dos diagnósticos completos: [PREENCHER]
- Procedimento de acesso, correção, exclusão e revogação: [PREENCHER]

O checkbox obrigatório preserva o briefing. Marketing e WhatsApp são opcionais, separados e desmarcados. O servidor registra horário, versão e URL da política.

Não encaminhe comentários livres a campanhas. Os campos orientam a não identificar terceiros.

## Retenção

- Rascunho local: sete dias desde a última alteração; removido na conclusão ou por ação do usuário. Expiração aplicada ao reabrir o navegador.
- Contato antes do envio: somente memória da página.
- UTMs: sessão do navegador.
- Rate limit: HMAC com rotação horária e limpeza de registros vencidos há mais de um dia.
- Sessões de início: 90 dias, sem contato ou respostas.
- Diagnósticos finais: prazo [PREENCHER], incluindo backups. Não há prazo inventado.

Agende diariamente a função public.purge_ephemeral_data() em Supabase Cron ou rotina interna autenticada. Ela limpa rate limits e sessões antigas. Não há agendamento ativo nesta entrega. Somente service role pode executá-la; nunca exponha essa chave.

O painel usa 30 dias por padrão. A taxa de conclusão só é completa dentro da janela de retenção de 90 dias. Leads antigos continuam consultáveis. O painel oculta as métricas de conclusão quando o período solicitado começa antes da janela de 90 dias.

## Exclusão solicitada

Confirme a identidade por procedimento apropriado antes de atender pedidos. Não há endpoint público de exclusão.

Excluir o lead elimina submissões, respostas e fila por cascade. No SQL Editor, com UUID verificado:

~~~sql
begin;
delete from public.quiz_sessions
where id in (select session_id from public.submissions where lead_id='[UUID_REAL_DO_LEAD]');
delete from public.leads where id='[UUID_REAL_DO_LEAD]';
commit;
~~~

A exclusão pode alterar métricas históricas. Não faça exclusão por e-mail sem revisar todas as correspondências.

## Revogar marketing

~~~sql
begin;
update public.leads
set marketing_consent=false, whatsapp_consent=false
where id='[UUID_REAL_DO_LEAD]';
update public.marketing_outbox
set status='cancelled', processed_at=now()
where lead_id='[UUID_REAL_DO_LEAD]' and status in ('pending','failed');
commit;
~~~

Antes de qualquer integração, reconsulte o consentimento atual no momento do envio. Para mudanças frequentes, acrescente histórico restrito de consentimentos. O horário e a versão atuais identificam o aceite original.

## Logs e CSV

O código não registra corpo das requisições, IP, contato, tokens, respostas ou erros internos do banco. Revise também os logs mantidos pelos provedores.

O CSV contém dados pessoais e classificações. Use-o para análise interna autorizada e armazenamento restrito. Exportação não autoriza marketing; filtre as permissões apropriadas.
