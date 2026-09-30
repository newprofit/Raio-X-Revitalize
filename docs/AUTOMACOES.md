# E-mail e automações futuras

Nenhum e-mail, WhatsApp ou webhook é enviado nesta entrega.

## Preparação existente

A transação cria item em marketing_outbox somente quando houver autorização de marketing e/ou WhatsApp. Ele contém referências internas e autorizações, sem respostas, comentários, pilar, desafio ou conteúdo religioso.

Um futuro worker deve:

1. Buscar itens pendentes com bloqueio/claim para evitar concorrência.
2. Reconsultar o consentimento e ignorar itens revogados.
3. Selecionar campos mínimos para o canal autorizado.
4. Usar idempotência baseada no ID do item.
5. Registrar sucesso/falha sem payload pessoal.
6. Implementar retentativas limitadas e descadastro.
7. Nunca encaminhar dificuldades, textos ou respostas para plataformas de anúncios.

A fila é uma preparação, não um CRM conectado. Credenciais do provedor ficam somente no servidor.

## E-mail transacional

Escolha o provedor e configure:

- Domínio/remetente reais: [PREENCHER]
- SPF, DKIM e DMARC fornecidos pelo provedor.
- API key como segredo da função.
- Template de confirmação revisado.
- Tratamento de falhas, bounces e limites.

Separe mensagens operacionais de campanhas. Não coloque diagnóstico sensível no assunto ou em URLs. Enviar o resultado por e-mail não está implementado: exige decisão sobre conteúdo e acesso seguro.

O custom SMTP do Supabase Auth é independente e atende convites/recuperação de contas administrativas; não é o mecanismo de e-mail para leads.

## GTM e Meta Pixel

A camada analytics aceita apenas sete nomes de evento. Atualmente são eventos locais, sem conexão externa.

Antes de ligar qualquer SDK, revise a compatibilidade do contexto religioso da página com as políticas da plataforma. Mesmo um evento genérico pode ser associado à URL pela biblioteca.

Não habilite advanced matching, enhanced conversions, captura de formulários, DOM scraping, auto events ou gravação de sessões. Filtrar só o payload manual não basta quando a biblioteca coleta dados automaticamente. Preserve as restrições do briefing.
