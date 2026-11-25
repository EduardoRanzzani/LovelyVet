# LovelyVet — decisões técnicas e de negócio

## Checkpoint vigente — 1.6.0 / backend 2.2–3.3 e teste de webhook — 25/11/2026

Backend 2.2–3.3 entregue, aguardando fechamento das validações locais e homologação integrada. Commit da fundação 2.1 confirmado pelo desenvolvedor; hash não fornecido. Último resumo Vitest comprovado: 788 testes/89 arquivos. Instalador 2.2/2.3 concluiu; validações 3.1/3.2 confirmadas pelo desenvolvedor após correção de formatação. Para 3.3, são esperados 908 testes/99 arquivos, ainda sem resumo local. Executar a suíte completa antes do commit deste bloco; registrar contagem efetiva no próximo checkpoint.

Em 25/11/2026, desenvolvedor confirmou configuração local das credenciais DEV, Collector ID e Cloudflare Quick Tunnel. Log de Next.js confirmou POST externo sem assinatura com HTTP 401; a simulação com data.id=123 chegou ao serviço de conciliação após validação HMAC e retornou HTTP 500 com log genérico. Simulação com ORD_TEST retornou 401. Não há evidência da causa específica do 500, de consulta bem-sucedida de Order, de recebimento ou de conciliação real. Não registrar URL temporária ou credenciais. A assinatura secreta apareceu em captura; regenerar no painel, atualizar apenas o .env local, reiniciar e revalidar. Rotação não confirmada. Encerrar túnel quando não necessário.

Manter MERCADO_PAGO_ENABLED=false e gate de criação no código; frontend 4.1 deve ser desenvolvido sem liberar chamadas externas até validar conta/ambiente remoto, concorrência, compatibilidade da 1.5.0 em produção e escopo exclusivo do pet Teste. Banco compartilhado por aceite explícito, com limpeza posterior dos registros fictícios. Migration 0048 aplicada e imutável; versão do package.json 1.5.0 até release 1.6.0. Sem nova migration ou dependência neste checkpoint. Não fazer push da master se houver deploy automático. Persistem dois advisories moderados DEV aceitos; audit-prod limpo na última evidência enviada (etapas 2.2/2.3), revalidar agora.

Próxima ação: validar pacote documental e revisar/stage exclusivamente o conjunto do backend 2.2–3.3, realizar commit local após validações. Em seguida, etapa 4.1: interface do tutor, SDK React, estado de tentativa, Pix e cartão tokenizado, atualização de status e acessibilidade; manter light, sem setState em useEffect. Homologar com Order de teste válida posteriormente. Não confundir aceitação HMAC com homologação financeira.

## Histórico — checkpoint — 1.6.0 / etapa 3.3 (entrega parcial) — 25/11/2026

Etapas 2.2/2.3 instalador aprovado (contagem prevista 830/93 sem resumo); 3.1/3.2 desenvolvedor confirmou validações após formatar reconciliation.service.ts com Prettier (contagem prevista 880/97, resumo não enviado). Última contagem comprovada por log: 788/89. Commit 2.1 confirmado. Migration 0048 aplicada e imutável. Versão 1.5.0 preservada. Banco compartilhado por aceite explícito; homologação somente no UUID reservado do pet Teste, limpeza posterior.

Etapa 3.3: syncOnlinePayment autentica tutor iniciador, vínculo atual e ambiente/recebedor; reserva consulta por tentativa usando updated_at (intervalo de 15 s), lock de atendimento e vínculo; chamadas GET fora da transação. Recuperação por provider_order_id ou busca Orders por external_reference exata e intervalo de até 29 dias; exige data única e paging.total=1; busca vazia/ambígua não libera saldo nem recria pagamento. Reusa conciliação transacional com referência esperada e reautoriza antes de retornar status, valor e Pix minimizado (texto e base64 com assinatura PNG, sem ticket_url nem payload bruto). Retorno Pix apenas pending com IDs conferidos, pares waiting_transfer, zero pago, cobrança aberta e saldo compatível; validar formato real em homologação. Não há job em background nem garantia de recuperar Order fora da janela; revisão humana e cancelamento remoto ainda pendentes. Consulta de tentativas terminais retorna status local; notificações posteriores seguem webhook.

Gate de criação permanece ativo: validar conta/ambiente remoto, compatibilidade da versão 1.5.0 com o banco compartilhado e concorrência real antes de liberar. Guardas de pagamentos manuais/cancelamento já entregues, política conservadora mantida. Não há nova migration, SDK ou mudança de versão. Testes de recuperação e referência: 28 novos casos previstos (908/99 esperados se 880/97 confirmados); mocks e verificações estáticas não comprovam concorrência PostgreSQL. Validação local pendente. Próxima ação: validar pacote, configurar homologação e testar controles reais antes da ativação; desenvolver interface e revisão/recuperação operacional. Não fazer push ou deploy. Atualizar seis Markdown em cada entrega e versão somente no release.

## Histórico — checkpoint — 1.6.0 / etapas 3.1 e 3.2 entregues parcialmente (25/11/2026)

Etapas 2.2/2.3: instalador confirmou bloco validado, Drizzle check e audit-prod sem vulnerabilidades conhecidas; resumo Vitest não enviado (830/93 previstos, contagem a confirmar). Última contagem comprovada: 788/89. Commit 2.1 confirmado pelo desenvolvedor. 0048 aplicada e imutável; versão 1.5.0 até release 1.6.0. Mesmo banco DEV/PROD por aceite explícito, teste apenas no UUID do pet Teste, limpeza posterior.

Etapas 3.1/3.2 entregues parcialmente: rota POST pública específica /api/webhooks/mercado-pago, HMAC-SHA256 do manifest (data.id, x-request-id, ts) em tempo constante, sem confiar no corpo. Consulta Orders autenticada antes da transação; recebedor user_id, referência UUID, IDs, país BRA, método, valores e estados da order/transação validados, live_mode validado quando presente. Campo ausente não prova ambiente: validar credenciais/contas distintas em homologação; não ativar criação. Dentro do lock do atendimento, reconsulta tentativa/cobrança e ledger, baixa única por tentativa e operação, atualização isPaid atômica quando saldo quitado; review bloqueia novas tentativas; divergências, estornos e aprovações tardias não alteram saldo automaticamente. Duplicatas não geram novo lançamento; respostas atrasadas não rebaixam aprovação. Recuperação por webhook via external_reference mesmo sem ID local; busca ativa de Orders sem webhook, QR Code, observabilidade/revisão humana, confirmação efetiva de ambiente e testes reais de concorrência/constraints seguem pendentes. Não há estorno automático. Sem nova migration ou dependência.

Gate de criação continua ativo mesmo com flag true, especialmente porque 1.5.0 em produção não tem guardas atualizadas; não fazer pagamentos reais/simulados externos ainda. Webhook não depende da flag de criação e pode reconciliar tentativas existentes se configurado. Sem credenciais no pacote. Validação local completa pendente; 50 novos casos previstos em quatro arquivos (880/97 esperados se a contagem anterior de 830/93 for confirmada); testes unitários de assinatura, política, rota e persistência com mocks, não substituem execução real no PostgreSQL. Próximo: validar pacote, implementar recuperação ativa, completar etapa 3.3 e testes de integração antes de liberar gate. Não fazer push/deploy ou commit automático.

## Histórico — checkpoint — 1.6.0 / etapas 2.2 e 2.3 entregues para validação (25/11/2026)

Etapas 1.1–2.1 validadas (788 testes/89 arquivos, audit-prod limpo, duas moderadas DEV aceitas); commit local confirmado pelo desenvolvedor, hash não informado. Migration 0048 aplicada e imutável. Banco compartilhado e risco aceitos; testes exclusivamente no UUID do pet Teste. Versão 1.5.0 preservada.

Bloco 2.2/2.3 entregue para validação: schema estrito Pix/crédito tokenizado, valor integral restante calculado no servidor, autorização por vínculo atual do tutor com o pet e lock de atendimento/vínculo, reserva processing antes da rede, UUID da tentativa como external_reference e idempotencyKey. Chamadas fora da transação. Resposta inicial apenas registra IDs e estados externos sem baixa, sem persistir cartão, token, CPF ou resposta bruta; timeout/erro mantém tentativa bloqueada, sem criar novo pagamento. Guardas de recebimento manual/cancelamento compartilham lock do atendimento e bloqueiam tentativas ativas, review e approved (regra conservadora provisória). Não confundir idempotência da requisição com conciliação concluída.

Gate de código impede chamadas reais mesmo com feature flag true; não remover até validar recebedor/ambiente no provedor, implementar webhook e conciliação, recuperação por referência, liberar tentativa apenas após confirmação remota e coordenar a compatibilidade com o código 1.5.0 em produção (não possui as novas guardas). QR Code/Pix Copia e Cola e UI ainda pendentes; não executar transações reais. Sem alteração de dependências, versão ou migration. Testes novos: 42 casos previstos em quatro arquivos; validação completa pendente (830/93 esperados). Testes reais de concorrência PostgreSQL, recuperação, integridade e homologação ainda pendentes. Próxima ação: aplicar pacote, validar, depois etapa 3.1/3.2 e completar os gates de 2.2/2.3. Não fazer push ou deploy.

## Histórico — checkpoint — 1.6.0 / etapas 1.1–2.1 validadas (25/11/2026)

Etapas 1.1, 1.2 e 2.1 concluídas quanto ao escopo entregue. Log local da etapa 2.1: SDK `mercadopago@3.6.1` instalado, frozen-lock, Prettier, ESLint, TypeScript, Vitest (788 testes em 89 arquivos, 9,72 s), Drizzle check e audit-prod aprovados. São 44 novos testes em relação aos 744 da etapa 1.2. SHA-256 do lockfile observado: `605df9df93f09d33b932cbb00aaa88561ecb8985e2939374a2da26d3172b71b8`. Audit-all reportou somente as duas moderadas DEV já aceitas (esbuild GHSA-67mh-4wv8-2f99; minimatch GHSA-g3hv-75wg-m249); não equivale a auditoria integral de segurança.

Migration 0048 aplicada em `lovelyvet-application`, ID 16, created_at 1795610000000, SHA-256 `640808ca0531b9ca2336f3db7d99ab28a1c38fd376df36348a0b21bf472551b1`. Capturas confirmam zero recebimentos antes/depois e zero tentativas após a migration. Backup e testes reais de constraints com inserts ainda não comprovados. Não reaplicar nem editar a migration aplicada. Banco compartilhado mantido por decisão expressa e risco aceito; restringir testes ao UUID reservado do pet Teste (`c943e3cd-d2bb-4c19-a386-5a8e56899128`), conferir ambiente e recebedor, limpar registros fictícios antes do release. A baixa simulada pode afetar temporariamente indicadores reais; não testar em pets reais.

Checkpoint de Git solicitado pelo desenvolvedor: 20 arquivos esperados, incluindo seis Markdown, manifesto/lockfile, migration e modelagem, cliente e testes. Commit local a realizar após revisão e validação documental; hash ainda não informado. Manter `package.json` em 1.5.0 até o fechamento do release 1.6.0; changelog registra alterações não publicadas. Não fazer push/deploy automático da master. Produção permanece 1.5.0, sem nova homologação ou build comprovados nesta etapa.

Próxima etapa: 2.2 e 2.3 em conjunto (criação de tentativas Pix/cartão, autorização, escopo, concorrência, idempotência, recuperação de timeout). Manter chamadas reais desabilitadas até conciliação segura, validar ambiente e recebedor no provedor e não persistir dados sensíveis do cartão. Integrar bloqueio comum com recebimentos manuais/cancelamento; webhook e ledger idempotente, estados tardios, excedentes e contestações ainda pendentes. Não considerar status normalizado como prova de pagamento. Testes de rede, integração, constraints, configuração real e UI ainda pendentes. Os checkpoints anteriores são históricos; este prevalece.

## Histórico — checkpoint — 1.6.0 / etapa 2.1 entregue (25/11/2026)

Etapa 1.2 concluída: log local confirmou Prettier, ESLint, TypeScript, Vitest (744 testes em 87 arquivos, 10,89 s) e Drizzle check. Capturas do banco `lovelyvet-application` confirmam 0048 aplicada, ID 16, created_at 1795610000000, SHA-256 `640808ca0531b9ca2336f3db7d99ab28a1c38fd376df36348a0b21bf472551b1`, tabela de tentativas criada, zero tentativas e zero recebimentos antes/depois. Backup e teste de constraints com inserts não comprovados. Não reaplicar 0048 nem modificar migrations anteriores. Banco compartilhado e risco aceitos; testes somente no UUID reservado do pet Teste, limpeza transacional antes do release.

Etapa 2.1 entregue para validação local: cliente Orders server-only preguiçoso, timeout 10 s, cache por token, configuração estrita e compatibilidade entre `CLERK_ENVIRONMENT` e `MERCADO_PAGO_TEST_MODE`, recebedor esperado numérico, flag de novas cobranças desligada por padrão, valores inteiros em centavos para string decimal exata. Conciliação futura não dependerá da flag de novas cobranças. SDK `mercadopago@3.6.1` escolhido em vez do 3.5.1 do Vena Imports pelo fix de path traversal citado no changelog oficial (https://github.com/mercadopago/sdk-nodejs/releases/tag/3.6.1); instalar com pnpm e revisar lockfile/auditoria reais. Nenhum lockfile gerado manualmente, nenhuma credencial incluída. Modo configurado não garante que credenciais correspondam ao ambiente; validar conta/ambiente via provedor antes de liberar pagamentos. Public Key e débito serão usados na etapa de UI, sem SDK frontend nesta etapa.

Classificação preliminar dos pares status/status_detail de Orders; estornos, contestações e estados desconhecidos direcionados para revisão. A classificação approved não autoriza baixa: validação da transação, conta, ambiente, referência, valor e transição transacional fica para a conciliação. Validação de configuração por funções estritas, sem Zod adicional; tratamento de erros remotos na etapa que realizar chamadas.

44 novos casos previstos em dois arquivos (788 testes/89 arquivos esperados); execução real pendente. Não há criação de cobrança, chamada autenticada, webhook, conciliação, registro no ledger ou alteração de banco nesta entrega. Próxima ação: instalar SDK fixado, aplicar pacote, executar frozen-lock, format:check, check, drizzle check e audit-prod; enviar log e diff de dependências. Depois etapa 2.2/2.3 (sessões, Pix/cartão, autorização, escopo e concorrência). Versão permanece 1.5.0, sem commit/push/migration automáticos.

## Histórico — checkpoint — 1.6.0 / etapa 1.2 (25/11/2026)

Decisão explícita do desenvolvedor: manter o mesmo PostgreSQL e banco `lovelyvet-application` em DEV e PROD, inclusive para homologar recebimentos simulados no ledger existente. Aceite do risco de interferência temporária nos indicadores de produção, condicionado a testes exclusivamente no pet `Teste` (UUID `c943e3cd-d2bb-4c19-a386-5a8e56899128`) e limpeza transacional posterior antes do release. Não clonar, criar banco ou separar ledger. Credenciais e Clerk continuam separados; não testar cobranças de pets reais. O aceite não elimina riscos de concorrência, migrations em banco compartilhado ou erros de configuração.

Etapa 1.2 entregue para validação local: `online_payment_attempts`, origem manual/online em `charge_payments`, autoria manual preservada, vínculo composto por tentativa/cobrança/valor/método, unicidade por tentativa e IDs externos por ambiente, índice parcial de tentativa ativa por cobrança (created/processing/pending); revisão fica fora do índice para registrar eventos tardios, com bloqueio de novas tentativas pelo serviço futuro. UUID da tentativa será referência externa e chave de idempotência. O helper `assertOnlinePaymentScope` fixa o pet reservado e rejeita cruzamento de ambientes; ainda deve ser chamado por todas as ações e conciliação futuras, com ambiente e pet resolvidos no servidor. Pagamento real no pet reservado é rejeitado pelo helper (decisão preventiva). A migration `0048_online_payment_attempts` foi preparada com snapshot e journal; NÃO aplicada. Não executar automaticamente, nem publicar código que dependa das novas colunas antes de validação e aplicação controlada. Versão permanece 1.5.0.

Nenhuma integração de rede, webhook ou baixa automática nesta etapa. O estado aprovado exige IDs externos e data, mas autenticação do provedor e atomicidade tentativa/ledger, bloqueio de pagamentos manuais/cancelamentos durante tentativa ativa, conciliação de excedentes/estornos, limpeza e autorização completa são gates das etapas seguintes. O ledger não deve aceitar excedentes; não confundir tentativa com recebimento. Última evidência real anterior: 731 testes/85 arquivos; 13 testes novos propostos, execução pendente. Próxima ação: validar pacote (`pnpm format:check`, `pnpm check`, `pnpm exec drizzle-kit check`), revisar migration e confirmar estratégia de aplicação/backup; depois cliente Mercado Pago. Nenhum commit ou deploy automático.

## 1.6.0 — revisão com referência Vena Imports (25/11/2026)

**Direção técnica:** Checkout Transparente com Orders, SDK oficial backend e React/Card Payment Brick, substituindo a proposta de Checkout Pro. Pix e crédito inicialmente; débito desligado. Pagamento online do saldo integral restante; recebimentos manuais parciais preservados. Parcelamento e responsabilidade por taxas a detalhar; valor líquido de repasse não determina a baixa do valor bruto devido. Sem estornos iniciados pelo LovelyVet nesta versão.

- Vena Imports usa `Order` de `mercadopago`, timeout de 10 s, `idempotencyKey` e webhook `order` com validação de assinatura e consulta autenticada. Reutilizar conceitos, dividir serviços por responsabilidades. A referência externa por pedido e recuperação por valor não devem ser copiadas; usar UUID da tentativa e identidade inequívoca do provedor.
- Tentativa não é recebimento. Modelar `online_payment_attempts` e a ligação ao `charge_payments` na etapa 1.2. Preservar autoria manual; representar recebimento automatizado explicitamente. Não impor um único pagamento aprovado por cobrança. Uma tentativa ativa por cobrança, controle transacional comum a recebimentos manuais e cancelamentos, sem chamadas de rede dentro da transação. Definir tratamento de aprovação tardia/duplicada, excedente, falha ambígua e chargeback antes de ativar; nunca ocultar dinheiro efetivamente recebido.
- Configuração proposta: `MERCADO_PAGO_ENABLED=false`, `MERCADO_PAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`, `MERCADO_PAGO_TEST_MODE=true`, `MERCADO_PAGO_WEBHOOK_SECRET`, `NEXT_PUBLIC_ENABLE_DEBIT_CARD=false`, `MERCADO_PAGO_COLLECTOR_ID`. Public Key não é segredo; variáveis NEXT_PUBLIC são incorporadas no build. Troca de token/conta exige configuração consistente e novo build quando a Public Key mudar. A flag controla novas tentativas, não desliga conciliação de transações anteriores.
- Isolamento: preferir instância PostgreSQL separada para DEV/homologação, banco `lovelyvet-application-dev`, usuário exclusivo e dados sintéticos, Clerk Development e outros serviços externos de teste. Instância compartilhada só após provar isolamento efetivo de credenciais e permissões, inclusive acesso a produção; não alterar ACL de produção sem plano próprio. O nome de banco não é suficiente. Nenhum provisionamento realizado nesta entrega.
- Runtime e drizzle-kit usam `DATABASE_URL`. Verificar conexão real e journal; restaurar somente estrutura ou executar cadeia revisada em banco vazio, nunca clonar dados reais. A migration 0047 é a última do ZIP; 0048 ainda não existe. Não manipular histórico manualmente nem executar push de schema como substituto de migration.

## 1.6.0 — decisão de recebedor e proposta de arquitetura (25/11/2026)

**Decisão confirmada pelo desenvolvedor:** uma única conta Mercado Pago recebedora por ambiente. Em homologação, criar uma aplicação na conta do desenvolvedor e utilizar credenciais de teste; em produção, aplicação na conta da esposa e credenciais reais. Sem marketplace, OAuth para múltiplos vendedores ou split. Mesmo código, configuração de servidor separada; não transferir credenciais via chat ou Git.

**Propostas técnicas para aprovação na etapa 1.1:**

- Checkout Pro hospedado, preferencialmente REST via fetch; definir variante da API (Preferences ou Orders), métodos disponíveis, parcelamento, expiração da sessão e regra de reabertura antes da implementação. Pagar saldo integral restante, preservar pagamentos manuais e não descontar taxas do valor quitado pelo tutor.
- Configuração candidata: MERCADO_PAGO_ENABLED (false por padrão), MERCADO_PAGO_MODE (test/production), MERCADO_PAGO_ACCESS_TOKEN, MERCADO_PAGO_WEBHOOK_SECRET, MERCADO_PAGO_COLLECTOR_ID (identidade esperada), URL base pública por ambiente. Nomes e formato finais a validar com a API escolhida. Public Key somente se o fluxo escolhido exigir. Validar consistência no servidor e falhar de forma segura; não deduzir modo por prefixo do token.
- Banco atualmente compartilhado: recomendar separar o banco de homologação, usar somente dados fictícios e Clerk Development. Sem isolamento comprovado, testes de checkout não podem efetuar baixa real nem modificar o financeiro compartilhado. A decisão de infraestrutura permanece pendente; nenhuma criação de banco executada.
- Modelar tentativas com referência única, ambiente, conta esperada, valor em centavos, status, expiração, IDs do provedor e rastreabilidade. Integrar pagamentos aprovados ao ledger uma única vez, sob o mesmo lock do atendimento usado por pagamentos manuais. Rever obrigatoriedade de receivedBy para distinguir recebimento manual de automatizado sem inventar um Admin. Modelagem e constraints serão revisadas na etapa 1.2; não aplicar migration automaticamente.
- Não confiar em redirect de sucesso. Webhook autenticado e consulta da API; validar conta, ambiente, moeda BRL, valor e referência interna. Definir tratamento de pagamento tardio ou concorrente, estorno e chargeback antes da homologação; estorno pelo LovelyVet fora do escopo inicial.

Referências oficiais consultadas em 25/11/2026:

- [Contas de teste Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/test-accounts)
- [Credenciais](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/resources/credentials?scope=prod)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/resources/notifications/webhooks)

As referências abrangem variantes da API; não misturar contratos entre Orders e Preferences. A escolha final será explícita antes de escrever código.

## Decisões vigentes após homologação 1.5.0 — 25/11/2026

- Registrar a publicação e os 12 itens da homologação em produção conforme confirmação expressa do desenvolvedor. A 1.5.0 é a base estável vigente; hash do commit e URL/logs de deploy ainda não documentados. Separar este commit documental do commit de release; não criar automaticamente novo deploy ou tag.
- Preservar a política clínica e o layout definitivo V4: foto grande, sete ações coloridas de altura uniforme, largura completa da coluna, divisão 50/50 em telas grandes e empilhamento responsivo; Customer somente Linha do Tempo e alteração exclusiva da foto, respeitando privacidade. As decisões de previews anteriores são históricas.
- Manter os dois riscos DEV expressamente aceitos até haver atualização compatível; não omitir advisories nem desativar strict peers. O aceite não se estende ao PDF público por link ou a outros riscos. Revisão focal não equivale a auditoria integral; manter backlog complementar sem modificar a versão publicada neste fechamento.
- Manter pet Teste, foto e três vínculos com tutores para homologação. Limpeza do histórico fictício confirmada; não repetir SQL. Sanitização de HTML continua valendo para todos os pets. Não repetir a migration 0047.
- Próximo ciclo: 1.6.0, Mercado Pago no portal `/my-finance`, com webhooks seguros, idempotência, conciliação, atualização automática da cobrança e prevenção de duplicidade inclusive entre tutores do mesmo pet; preservar pagamentos manuais. Não incluir estornos, não solicitar credenciais reais nem escolher arquitetura detalhada sem revisar o código atualizado. Planejamento ainda não iniciado; nenhuma implementação de 1.6.0 neste pacote.

O presente checkpoint prevalece sobre estados históricos de preparação e decisões provisórias dos previews. Preservar os seis Markdown em toda entrega.

## Decisões de fechamento local 1.5.0 — 25/11/2026

- Manter o pet Teste como cadastro de homologação, inclusive foto e três vínculos com tutores. Limpar exclusivamente o histórico fictício identificado por UUID, nunca por nome isolado. Desenvolvedor confirmou a limpeza; não repetir a transação. Não alterar cadastros de terceiros nem identidades Clerk. Banco compartilhado exige backup e escopo explícito em futuras operações.
- Manter as versões do lockfile validado e o aceite temporário restrito aos dois advisories DEV já registrados. Não forçar versões principais de dependências transitivas. Não desativar auditoria ou strict peers.
- Preservar sanitização de HTML para todos os pets, independentemente da limpeza do banco. Não alterar PDFs assinados existentes. Revisão final aprovada em 731 testes/85 arquivos e build; homologação manual não pode ser presumida. Política de PDF público por link permanece a confirmar antes da publicação.
- Fechamento consolidado em commit `release: v1.5.0`, solicitado pelo desenvolvedor. Incluir apenas os 39 caminhos conhecidos e revisar o diff. Não aplicar migrations novamente. Publicação pelo fluxo já configurado, sem assumir provedor de deploy; registrar evidências depois da homologação.

## Fechamento 1.5.0 — decisão vigente de revisão e riscos (25/11/2026)

O desenvolvedor aceitou expressamente, em 25/11/2026, manter temporariamente as duas ocorrências moderadas exclusivamente DEV: GHSA-67mh-4wv8-2f99 (esbuild via Drizzle Kit) e GHSA-g3hv-75wg-m249 (minimatch via TypeScript ESLint). Aguardar atualização compatível dos consumidores, sem forçar majors, sem ocultar advisories e sem expor servidores dev a terceiros. Aceite restrito a esses dois advisories, condicionado a audit-prod sem alertas e ausência de novos advisories ou mudança de gravidade/escopo. Audit-all continua com seu resultado real; qualquer alerta adicional bloqueia o release. Fixes transitivos existem segundo o log, mas a compatibilidade não foi demonstrada. Revisar no próximo ciclo de manutenção.

- Sanitizar HTML persistido também nas telas de leitura, mantendo as classes e estilos fixos da representação gerada, sem reescrever o banco ou o PDF assinado. Reutilizar DOMPurify isomórfico para texto simples em SSR. Não refazer o layout V4.
- Busca por tutor deve respeitar a mesma privacidade da resposta ao Customer. Doctor administra clientes comuns, mas não edita dados da conta privilegiada Admin/Doctor pelo cadastro de clientes; Admin mantém acesso. Checar papel no predicado da escrita também.
- Limpeza não será adiada: inventário somente leitura, autorização por ID e análise de vínculos, backup verificável e transação de exclusão específica em etapa posterior; não usar nomes como autorização de exclusão. Nenhum registro excluído neste pacote. Não reexecutar migration 0047.
- Revisão estática focal e testes adicionais aguardam validação local. Preservar decisões clínicas e de layout, sem iniciar 1.6.0, sem atualizar versões de dependências e sem assumir homologação manual não confirmada.

## Candidato 1.5.0 — avaliação de risco residual DEV (25/11/2026)

Remoção do Shadcn CLI confirmada (197 pacotes retirados), preservando UI; suíte 718/83, frozen-lock, audit-prod, Drizzle check e build aprovados. Decisão proposta, ainda não aprovada: manter versões efetivamente validadas do Drizzle Kit e ESLint, sem impor versões principais transitivas de esbuild/minimatch; considerar aceite temporário somente dos dois advisories moderados dev registrados em SECURITY_AUDIT, com mitigação operacional e revisão no próximo ciclo de manutenção. Não alterar configuração do audit, não ocultar ocorrências e não tratar audit-all como aprovado. O gate vigente permanece bloqueante até decisão expressa. Aceite de risco DEV não equivale ao aceite da política pública de PDFs, homologação manual ou autorização para exclusão de dados. Registrar essas decisões separadamente.

## Ferramentas de desenvolvimento e auditoria residual — 25/11/2026

Após hotfix, a árvore de produção ficou sem alertas conhecidos e os 718 testes passaram. Retirar Shadcn CLI das devDependencies porque componentes são código local e não há uso do CLI nos scripts nem importação do pacote no ZIP de referência. Preservar componentes, estilos e components.json. Se necessário no futuro, avaliar versão auditada do CLI antes de executá-lo sob demanda. Manter Drizzle Kit, ESLint, workspace e demais versões; não substituir majors transitivas sem validação de compatibilidade. Audit-all continua obrigatório; se apenas ele falhar, executar build e Drizzle check para diagnóstico sem liberar publicação nem suprimir o código de erro. Sem aceite implícito dos riscos.

## Correção da resolução de peers — 25/11/2026

Overrides globais por faixa podem reescrever faixas de peer dependencies, inclusive faixas alternativas que admitem Zod 3 ou 4. O lockfile original registrava node-forge ^1.3.3 como peer de @signpdf/signer-p12 3.3.0 e Zod ^3.25.28 || ^4 como peer de zod-to-json-schema 3.25.2. Fixar node-forge 1.4.4 e Zod 4.6.7 no manifesto direto e retirar os dois overrides conflitantes. Manter strict peer dependencies; não forçar Zod 4 nas ferramentas. O audit posterior decidirá se outros ajustes compatíveis são necessários. Preservar lockfile gerado localmente, sem exigir o hash pré-instalação após tentativa que possa tê-lo modificado; verificar manifestos anteriores por hash, fazer backup e validar lockfile congelado após resolução. Não aprovar skills externas automaticamente.

## Saneamento das dependências — 25/11/2026

Priorizar versões corretivas a partir do relatório local, manter Next e eslint-config-next alinhados, Vitest e dependências internas coerentes; preservar React e stack restante. Nodemailer 9 para 10 é mudança principal explícita a validar com tipos, envio de e-mail e build. Não aplicar `audit --fix --force`, não ignorar advisories, não excluir lockfile. Overrides específicos por faixa no workspace existente, preservando regras de build e nanoid. Lockfile gerado pelo pnpm real, não fabricado. Validar instalação, congelamento do lockfile, suíte, audit completo e produção, Drizzle check e build. Manter revisão de compatibilidade e não publicar com gate falho.

Atualização: 2026-11-25. Decisões recuperadas do documento de continuidade e padrões acordados nesta conversa.

## Preparação da 1.5.0 — 25/11/2026

- Consolidar instalação da limpeza V4, reforços pontuais e verificações de release numa única execução, sem mudar escopo por conta própria. Layout V4 preservado.
- Preservar compatibilidade de PDFs e QR codes já emitidos. `Referrer-Policy: no-referrer` e `X-Robots-Tag: noindex, nofollow, noarchive` são mitigação de exposição acidental, não autorização; decisão definitiva sobre compartilhamento público ainda pendente.
- Upload de equipe reutiliza `matchesPetPhotoSignature` para JPEG, PNG e WebP; rejeita arquivos vazios, mantém limite de 5 MB, papéis e pastas existentes. Cloudinary continua responsável pela decodificação. Não introduzir dependências.
- Rótulos de colunas e seleção múltipla usam plural estável; contagens de pendências respeitam singular apenas para 1.
- Pacote não executa migrations, exclusões de dados, commits ou deploy. Auditoria e build reais são gates; publicação depende também de revisão e homologação manual.

## TD-001 — Stack

Next.js 16.3.4 (App Router), React 19, TypeScript, PostgreSQL, Drizzle ORM/Kit, Clerk, Next Safe Action, Zod, Tailwind CSS, Shadcn/UI, Cloudinary, Vitest, Testing Library, ESLint, Prettier e pnpm. Papéis: `admin`, `doctor`, `customer`. Cloudinary consta no documento recuperado e no `package.json`; a descrição antiga que citava Cloudflare está desatualizada para armazenamento de imagens.

## TD-002 — Identidades Clerk e banco

Instâncias Clerk distintas para Development e Production, com PostgreSQL compartilhado. Identificar usuário por Clerk ID e ambiente; não associar automaticamente por e-mail, nem substituir IDs automaticamente. Exigir e-mail primário verificado. Validar webhook Svix com corpo original assinado. Provisionamento transacional compartilhado entre webhook e cadastro pela equipe. Preservar Admin ao editar veterinário administrador. Excluir identidade somente no ambiente correspondente. Alias Vitest exclusivo para `server-only`.

Central `/admin` exclusiva de administradores: busca nome/e-mail, paginação 20, consulta de ambos os ambientes e Clerk IDs, vínculo apenas no ambiente em execução, identidade validada pela API, e-mail primário verificado e correspondente, bloquear conta banida/bloqueada, duplicatas e substituição. Confirmação explícita, revalidação de permissões e identidade, gravação de vínculo e auditoria na mesma transação. Preservar UUID, papel, dados e vínculos anteriores. Sem desvinculação ou substituição nesta versão.

Migration 0047 aplicada e validada: não reaplicar. Usar Drizzle migrate após backup e validação de banco/histórico/hashes; não usar push ou CREATE TABLE isolado nesse fluxo. ID do histórico não precisa corresponder ao prefixo SQL. Não editar migrations já aplicadas silenciosamente.

## TD-003 — Agendamentos e cuidados clínicos

Etapas 1 e 2 implementadas e concluídas conforme histórico: agendamentos e disponibilidade, ciclo de vacinação, retornos e lembretes clínicos, filtro de serviços por espécie, reagendamento independente de atendimentos pendentes e confirmados, conflitos de horário e preservação de serviços, produtos, descontos, valores e status durante reagendamento. Hotfix de reagendamento homologado inclusive em atendimento real. Não alterar essa regra fora do escopo.

## TD-004 — Financeiro

Catálogo de serviços/produtos, preços históricos, cobranças após conclusão do atendimento, pagamentos manuais integrais e parciais, saldo, cancelamento conforme regras existentes, dashboard financeiro Admin, navegação mensal, extrato por tutor e histórico. Portal Customer `/my-finance` compartilha informações financeiras entre todos os tutores do mesmo pet (homologado com dois tutores); financeiro administrativo não duplica cobranças de pets compartilhados. Não implementar estornos na 1.5.0. Mercado Pago apenas na 1.6.0, preservando pagamentos manuais.

## TD-005 — Dashboards e interface

Dashboards Admin, Doctor e Customer implementados; refinamento e responsividade homologados. Valores de plantões são a primeira informação em Admin e Doctor. Customer mostra pets, próximos atendimentos, cuidados, vacinação e resumo financeiro; boas-vindas com fundo neutro. Versão apenas para Admin. Português, badges padronizados, singular apenas em quantidade 1, zero e demais no plural, sem dark mode. Preservar componentes compartilhados e visual existente.

## TD-006 — Fotos dos pets

Tutor pode adicionar, substituir ou remover exclusivamente a foto de pets aos quais está vinculado. Imagem circular aciona modal; prévia local antes de salvar. Não permitir edição de outros dados pelo tutor. Autorização no servidor, Cloudinary existente.

## TD-007 — Desenvolvimento incremental

Entregar arquivos completos em ZIP, script de instalação, hashes de base e payload, README, backup, bloqueio de sobrescrita e testes automatizados pertinentes. Prettier configurado, tabs, aspas simples e ponto e vírgula; evitar setState desnecessário em useEffect. Validação `pnpm format:check` e `pnpm check`. Não executar commits ou migrations automaticamente. Após homologação, fornecer `git add` e `git commit` específicos. Não alterar dados reais para testes. Regras detalhadas em `AGENTS.md`.

## TD-008 — Continuidade independente do chat

Aprovado nesta conversa: documentação versionada junto ao projeto em `AGENTS.md` e quatro arquivos em `docs/`. O roadmap responde pelo escopo; estado pelo checkpoint; decisões pela arquitetura e regras; auditoria pelas ocorrências e riscos. Ler todos antes de retomar. Atualizar a cada avanço e preservar evidências; não presumir que testes foram executados. O código mais recente e os resultados confirmados prevalecem sobre documentação desatualizada, que deve ser reconciliada explicitamente.

## TD-009 — Escopo de agendamentos e transações

A consulta de disponibilidade só pode excluir um agendamento autorizado pelo escopo existente (Admin, Doctor responsável ou Customer vinculado ao pet). A exclusão também inclui o escopo no predicado SQL, de modo que uma perda de acesso após a leitura inicial não oculte um horário ocupado. Permitir mudança de veterinário quando já autorizada pelas regras existentes; o filtro da agenda selecionada impede exclusão de agendamento de outro veterinário.

Nas alterações gerais de agendamento, travar a linha original com `FOR UPDATE` e revalidar acesso/status dentro da transação. Para Customer, proteger o vínculo existente com `FOR SHARE` e confirmar o acesso ao pet original e ao pet de destino; não criar ou alterar agendamento se o vínculo não existir. Gravações incluem escopo e, para status, condição de estado; não substituir itens quando a atualização não afetar uma linha. Preservar fluxo isolado de reagendamento e regras de preço, lembrete, histórico e autorização. O editor de itens já revalida o veterinário sob trava; revisão financeira e clínica mais ampla permanece nas etapas próprias. Não há mudança de schema.

Decisão de implementação da 4.1.3, validada e homologada conforme confirmação do desenvolvedor em 25/11/2026. Commit de fechamento pendente. A revalidação utiliza AuthContext da requisição; não constitui mecanismo de revogação global instantânea de sessões.

## TD-010 — Exclusão clínica compartilhada (SEC-005)

Decisão de negócio aprovada pelo desenvolvedor em 25/11/2026: Admin e qualquer Doctor podem excluir registros elegíveis da timeline, independentemente de autoria. Customer não exclui. Pesagens, observações, vacinas avulsas, receitas não assinadas, encaminhamentos e solicitações de exame são elegíveis. Receitas assinadas, vacinas ligadas a atendimento, prontuários de atendimento, agendamentos, patologias e anexos não podem ser removidos por esse fluxo. Preservar leitura e edição conforme políticas anteriores. Não introduzir restrição por autoria, soft delete ou auditoria clínica nesta etapa sem aprovação.

Usar `requireStaff`, condições ID/pet/tipo e `returning` para não sinalizar sucesso indevido. Travar vacina e receita com `FOR UPDATE`, verificar bloqueios após a trava e manter a exclusão de lembretes e vacina atômica. A assinatura digital já usa a mesma trava de receita. Na interface, alinhar botão e acionamento aos tipos, papel e proteção de cada item; a interface não substitui a autorização no servidor. Sem migration. Implementação aplicada; 691 testes em 80 arquivos aprovados e exclusões homologadas. Commit pendente de fechamento.

## TD-011 — Renderização das observações clínicas

Correção do HTML literal no histórico: renderizar exclusivamente as observações com o sanitizador de texto rico existente e a classe `rich-text-content`, sem renderizar HTML arbitrário em outros registros. Preservar filtragem do Customer, autorização e armazenamento. Validação do hotfix pendente. Redesign da tela de detalhes antecipado como preview, em pacote independente.

## TD-012 — Layout dos detalhes do pet

Manter os sete botões coloridos permanentemente visíveis, conforme preferência da equipe clínica inspirada no SimplesVet. Não substituir por menu. Cabeçalho compacto, dados cadastrais expansíveis, peso e histórico em largura total. Backup integral comentado de `PetDetailsClient` após o hotfix de observações, temporário até aprovação do visual. `TabHistory` e `PetTimelineClient` usam layout legado por padrão para facilitar reversão. Não ampliar acesso, funcionalidades ou regras de exclusão.

## Preview v2 — 25/11/2026

Preferência aprovada para cabeçalho original com foto grande e cadastro visível. Sete ações coloridas com células uniformes (1/2/3/4/7 colunas responsivas), sem spans especiais no preview. Painel clínico compartilhado com modo legado por padrão para reversão. Customer recebe somente Linha do Tempo em leitura, mantém alteração exclusiva da foto. Preservar filtro de privacidade no servidor; não implementar novas funções nas abas provisórias.

## Preview v3 — distribuição aprovada em 25/11/2026

Esta decisão substitui a distribuição de ações da v1/v2, não as proteções clínicas. Manter cabeçalho original e sete botões coloridos acessíveis sem menu. Área clínica em grid 50/50 a partir de 2xl; abaixo, ações antes do histórico. Grade de ações compacta, limitada a 36 rem, com colunas automáticas de largura mínima de até 11 rem e altura comum de 44 px. Selecionar os filhos diretos `button` e `a`, não `data-slot=button`, pois gatilhos Radix podem alterar esse atributo. Não impor span especial ao link de receita. Preservar painel de Linha do Tempo da v2 e comportamento legado para reversão. Manter backup comentado em `pet-details.tsx` até aprovação definitiva.

## Preview v4 — largura das ações

Substitui somente a limitação de largura da decisão da v3: remover `max-w-xl`, preencher a coluna com `w-full` e usar grade responsiva de uma, duas ou três colunas (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`). Manter sete células equivalentes, altura de 44 px, cores e ícones. Não modificar o cabeçalho, backup comentado, demais abas ou regras de acesso.

## Layout definitivo aprovado — 25/11/2026

A v4 é a referência visual aprovada. Esta decisão substitui as opções temporárias das v1–v3: cabeçalho original, sete botões coloridos com altura de 44 px e grade preenchendo toda a largura disponível (uma, duas ou três colunas); ações e histórico em metades iguais a partir de `2xl`, empilhados abaixo. Histórico e Linha do Tempo compartilham painel com rolagem natural. Remover backup comentado e props temporárias `expandedLayout` e `framed`, mantendo exatamente o modo aprovado. Reversões futuras por backup externo ou Git. Customer mantém somente Linha do Tempo, edição exclusiva da foto e filtros de privacidade; sem alteração das permissões no servidor.
