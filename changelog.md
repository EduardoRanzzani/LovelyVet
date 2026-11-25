## Histórico de alterações

### [Não publicado] — 1.6.0 / checkpoint backend e teste de webhook (25/11/2026)

Backend 2.2–3.3 entregue, aguardando fechamento das validações locais e homologação integrada. Commit da fundação 2.1 confirmado pelo desenvolvedor; hash não fornecido. Último resumo Vitest comprovado: 788 testes/89 arquivos. Instalador 2.2/2.3 concluiu; validações 3.1/3.2 confirmadas pelo desenvolvedor após correção de formatação. Para 3.3, são esperados 908 testes/99 arquivos, ainda sem resumo local. Executar a suíte completa antes do commit deste bloco; registrar contagem efetiva no próximo checkpoint.

Em 25/11/2026, desenvolvedor confirmou configuração local das credenciais DEV, Collector ID e Cloudflare Quick Tunnel. Log de Next.js confirmou POST externo sem assinatura com HTTP 401; a simulação com data.id=123 chegou ao serviço de conciliação após validação HMAC e retornou HTTP 500 com log genérico. Simulação com ORD_TEST retornou 401. Não há evidência da causa específica do 500, de consulta bem-sucedida de Order, de recebimento ou de conciliação real. Não registrar URL temporária ou credenciais. A assinatura secreta apareceu em captura; regenerar no painel, atualizar apenas o .env local, reiniciar e revalidar. Rotação não confirmada. Encerrar túnel quando não necessário.

Manter MERCADO_PAGO_ENABLED=false e gate de criação no código; frontend 4.1 deve ser desenvolvido sem liberar chamadas externas até validar conta/ambiente remoto, concorrência, compatibilidade da 1.5.0 em produção e escopo exclusivo do pet Teste. Banco compartilhado por aceite explícito, com limpeza posterior dos registros fictícios. Migration 0048 aplicada e imutável; versão do package.json 1.5.0 até release 1.6.0. Sem nova migration ou dependência neste checkpoint. Não fazer push da master se houver deploy automático. Persistem dois advisories moderados DEV aceitos; audit-prod limpo na última evidência enviada (etapas 2.2/2.3), revalidar agora.

Próxima ação: validar pacote documental e revisar/stage exclusivamente o conjunto do backend 2.2–3.3, realizar commit local após validações. Em seguida, etapa 4.1: interface do tutor, SDK React, estado de tentativa, Pix e cartão tokenizado, atualização de status e acessibilidade; manter light, sem setState em useEffect. Homologar com Order de teste válida posteriormente. Não confundir aceitação HMAC com homologação financeira.

### [Não publicado] — 1.6.0 / etapa 3.3 (entrega parcial)

Etapas 2.2/2.3 instalador aprovado (contagem prevista 830/93 sem resumo); 3.1/3.2 desenvolvedor confirmou validações após formatar reconciliation.service.ts com Prettier (contagem prevista 880/97, resumo não enviado). Última contagem comprovada por log: 788/89. Commit 2.1 confirmado. Migration 0048 aplicada e imutável. Versão 1.5.0 preservada. Banco compartilhado por aceite explícito; homologação somente no UUID reservado do pet Teste, limpeza posterior.

Etapa 3.3: syncOnlinePayment autentica tutor iniciador, vínculo atual e ambiente/recebedor; reserva consulta por tentativa usando updated_at (intervalo de 15 s), lock de atendimento e vínculo; chamadas GET fora da transação. Recuperação por provider_order_id ou busca Orders por external_reference exata e intervalo de até 29 dias; exige data única e paging.total=1; busca vazia/ambígua não libera saldo nem recria pagamento. Reusa conciliação transacional com referência esperada e reautoriza antes de retornar status, valor e Pix minimizado (texto e base64 com assinatura PNG, sem ticket_url nem payload bruto). Retorno Pix apenas pending com IDs conferidos, pares waiting_transfer, zero pago, cobrança aberta e saldo compatível; validar formato real em homologação. Não há job em background nem garantia de recuperar Order fora da janela; revisão humana e cancelamento remoto ainda pendentes. Consulta de tentativas terminais retorna status local; notificações posteriores seguem webhook.

Gate de criação permanece ativo: validar conta/ambiente remoto, compatibilidade da versão 1.5.0 com o banco compartilhado e concorrência real antes de liberar. Guardas de pagamentos manuais/cancelamento já entregues, política conservadora mantida. Não há nova migration, SDK ou mudança de versão. Testes de recuperação e referência: 28 novos casos previstos (908/99 esperados se 880/97 confirmados); mocks e verificações estáticas não comprovam concorrência PostgreSQL. Validação local pendente. Próxima ação: validar pacote, configurar homologação e testar controles reais antes da ativação; desenvolver interface e revisão/recuperação operacional. Não fazer push ou deploy. Atualizar seis Markdown em cada entrega e versão somente no release.

### [Não publicado] — 1.6.0 / etapas 3.1 e 3.2 (entrega parcial)

Etapas 2.2/2.3: instalador confirmou bloco validado, Drizzle check e audit-prod sem vulnerabilidades conhecidas; resumo Vitest não enviado (830/93 previstos, contagem a confirmar). Última contagem comprovada: 788/89. Commit 2.1 confirmado pelo desenvolvedor. 0048 aplicada e imutável; versão 1.5.0 até release 1.6.0. Mesmo banco DEV/PROD por aceite explícito, teste apenas no UUID do pet Teste, limpeza posterior.

Etapas 3.1/3.2 entregues parcialmente: rota POST pública específica /api/webhooks/mercado-pago, HMAC-SHA256 do manifest (data.id, x-request-id, ts) em tempo constante, sem confiar no corpo. Consulta Orders autenticada antes da transação; recebedor user_id, referência UUID, IDs, país BRA, método, valores e estados da order/transação validados, live_mode validado quando presente. Campo ausente não prova ambiente: validar credenciais/contas distintas em homologação; não ativar criação. Dentro do lock do atendimento, reconsulta tentativa/cobrança e ledger, baixa única por tentativa e operação, atualização isPaid atômica quando saldo quitado; review bloqueia novas tentativas; divergências, estornos e aprovações tardias não alteram saldo automaticamente. Duplicatas não geram novo lançamento; respostas atrasadas não rebaixam aprovação. Recuperação por webhook via external_reference mesmo sem ID local; busca ativa de Orders sem webhook, QR Code, observabilidade/revisão humana, confirmação efetiva de ambiente e testes reais de concorrência/constraints seguem pendentes. Não há estorno automático. Sem nova migration ou dependência.

Gate de criação continua ativo mesmo com flag true, especialmente porque 1.5.0 em produção não tem guardas atualizadas; não fazer pagamentos reais/simulados externos ainda. Webhook não depende da flag de criação e pode reconciliar tentativas existentes se configurado. Sem credenciais no pacote. Validação local completa pendente; 50 novos casos previstos em quatro arquivos (880/97 esperados se a contagem anterior de 830/93 for confirmada); testes unitários de assinatura, política, rota e persistência com mocks, não substituem execução real no PostgreSQL. Próximo: validar pacote, implementar recuperação ativa, completar etapa 3.3 e testes de integração antes de liberar gate. Não fazer push/deploy ou commit automático.

### [Não publicado] — 1.6.0 / etapas 2.2 e 2.3 (entrega parcial)

Etapas 1.1–2.1 validadas (788 testes/89 arquivos, audit-prod limpo, duas moderadas DEV aceitas); commit local confirmado pelo desenvolvedor, hash não informado. Migration 0048 aplicada e imutável. Banco compartilhado e risco aceitos; testes exclusivamente no UUID do pet Teste. Versão 1.5.0 preservada.

Bloco 2.2/2.3 entregue para validação: schema estrito Pix/crédito tokenizado, valor integral restante calculado no servidor, autorização por vínculo atual do tutor com o pet e lock de atendimento/vínculo, reserva processing antes da rede, UUID da tentativa como external_reference e idempotencyKey. Chamadas fora da transação. Resposta inicial apenas registra IDs e estados externos sem baixa, sem persistir cartão, token, CPF ou resposta bruta; timeout/erro mantém tentativa bloqueada, sem criar novo pagamento. Guardas de recebimento manual/cancelamento compartilham lock do atendimento e bloqueiam tentativas ativas, review e approved (regra conservadora provisória). Não confundir idempotência da requisição com conciliação concluída.

Gate de código impede chamadas reais mesmo com feature flag true; não remover até validar recebedor/ambiente no provedor, implementar webhook e conciliação, recuperação por referência, liberar tentativa apenas após confirmação remota e coordenar a compatibilidade com o código 1.5.0 em produção (não possui as novas guardas). QR Code/Pix Copia e Cola e UI ainda pendentes; não executar transações reais. Sem alteração de dependências, versão ou migration. Testes novos: 42 casos previstos em quatro arquivos; validação completa pendente (830/93 esperados). Testes reais de concorrência PostgreSQL, recuperação, integridade e homologação ainda pendentes. Próxima ação: aplicar pacote, validar, depois etapa 3.1/3.2 e completar os gates de 2.2/2.3. Não fazer push ou deploy.

### [Não publicado] — 1.6.0 / checkpoint das etapas 1.1–2.1

- Migration 0048 aplicada e conferida no banco compartilhado; 744 testes em 87 arquivos aprovados.
- Cliente Orders server-only, configuração de ambiente, flag de criação e formatação em centavos; SDK 3.6.1 instalado com pnpm; 44 novos testes aprovados.
- Classificação preliminar dos estados Orders; estornos, disputas e estados desconhecidos requerem revisão. A classificação não autoriza baixa financeira.
- Validação local: 788 testes em 89 arquivos (9,72 s), frozen-lock, Prettier, ESLint, TypeScript, Drizzle check e audit-prod aprovados. Audit-all mantém as duas moderadas DEV aceitas.
- Sem operações remotas, webhook, baixa financeira ou nova migration. Commit local solicitado, ainda não confirmado; versão 1.5.0 preservada. Próxima etapa: 2.2/2.3.

### [Não publicado] — 1.6.0 / etapa 1.2

- Modelagem de tentativas Mercado Pago, origem de recebimentos e migration 0048 aplicada posteriormente; evidências no checkpoint 2.1.
- Banco compartilhado mantido por aceite explícito do desenvolvedor, testes limitados ao pet Teste e limpeza antes da publicação.
- Sem SDK, webhook, novas dependências, baixa automática ou alteração de versão nesta entrega.

### [Não publicado] — revisão arquitetural 1.6.0

- Adotada direção de Checkout Transparente com Orders, Pix e cartão de crédito a partir do projeto de referência Vena Imports; substitui a proposta de Checkout Pro.
- Definidos requisitos de tentativas, referência externa, idempotência, conciliação, concorrência e autoria do ledger.
- Preparado roteiro e diagnóstico somente leitura para isolamento da homologação. Banco DEV ainda não provisionado ou verificado. Sem mudanças funcionais, migrations, dependências ou versão.

### [Não publicado] — planejamento 1.6.0

- Definida conta Mercado Pago única por ambiente: conta do desenvolvedor em homologação com credenciais de teste e conta da esposa em produção.
- Proposto isolamento do banco de homologação antes de testes que alterem saldos; decisão de infraestrutura pendente.
- Roadmap de integração financeira iniciado. Sem código, migration, credenciais, dependências ou versão alterados nesta entrega documental. A versão 1.5.0 segue vigente.

> 1.5.0 publicada e homologada em produção em 25/11/2026 (12/12 itens confirmados pelo desenvolvedor). Última validação local: 731 testes em 85 arquivos, audit-prod sem vulnerabilidades conhecidas, Drizzle check e build Next 16.4.5 aprovados em 25/11/2026. Audit-all mantém duas ocorrências moderadas DEV aceitas temporariamente. Limpeza do histórico fictício do pet Teste confirmada pelo desenvolvedor. Hash do commit e logs/URL de deploy ainda não fornecidos.

### [1.5.0] - 25/11/2026

- Agendamentos, reagendamento, vacinação, retornos e lembretes clínicos.
- Financeiro com cobranças, pagamentos manuais integrais e parciais, extratos e portal do tutor.
- Dashboards por perfil e alteração exclusiva de fotos de pets pelo tutor autorizado.
- Segurança Clerk por ambiente, vinculação administrativa e auditoria (migration 0047, já aplicada).
- Revalidação de autorização dos agendamentos e proteção transacional de exclusões clínicas.
- Correção da apresentação de observações com HTML sanitizado; layout responsivo definitivo V4 dos detalhes do pet.
- Cabeçalhos de privacidade na validação pública de receitas, preservando a interoperabilidade atual com o ITI.
- Validação do conteúdo de imagens nos uploads da equipe e ajustes pontuais de pluralização.
- Sanitização adicional de HTML histórico nas telas, extração isomórfica de texto no catálogo e proteção de privacidade da busca de pets.
- Restrição de alteração de contas privilegiadas por Doctor no cadastro de clientes.
- Documentação de continuidade versionada; ver checkpoint e auditoria para validações e riscos ainda pendentes.

Publicação e homologação em produção confirmadas pelo desenvolvedor em 25/11/2026. Audit-all mantém dois avisos moderados DEV aceitos temporariamente; SEC-006 (PDF por link) e revisões complementares permanecem no backlog. Não foram apresentados hash do commit nem logs independentes de deploy. Próximo ciclo: 1.6.0 (Mercado Pago). Ver documentação de continuidade.

### [1.2.0] - 06/09/2026

- hardening de roles e autorização
- BOLA de pets e appointments
- proteção de ações administrativas
- proteção de ações clínicas
- minimização de dados sensíveis
- sanitização de HTML
- proteção de email/WhatsApp/upload
- internalização de Clerk
- atualização de dependências
- pnpm audit --prod sem vulnerabilidades
- correção de build/runtime com Next 16.3.4

### [1.1.2] - 09/07/2026

- Melhoria na exibição dos menus laterais, mantendo a visibilidade conforme o perfil do usuário

### [1.1.1] - 07/07/2026

- Melhoria na tela de detalhes do pet, fazendo o bloqueio de exibição conforme o perfil do usuário, exibindo ou não informações necessárias

### [1.1.0] - 06/07/2026

- Adicionado changelog de controle de versões
- Versões anteriores não estão listadas aqui no changelog mas todas a partir de hoje estarão listadas
