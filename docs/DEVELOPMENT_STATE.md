## 1.6.0 — fechamento da etapa 4.2 — 26/11/2026

Este checkpoint prevalece sobre os registros anteriores do ciclo Mercado Pago.

- Fix 01 aplicado; desenvolvedor confirmou Prettier, ESLint, TypeScript, Vitest (983 testes em 108 arquivos), Drizzle check e audit-prod aprovados. Duração da suíte final não informada; 11,02 s refere-se à execução anterior com uma falha.
- Audit-all: somente as duas moderadas DEV previamente aceitas, esbuild (GHSA-67mh-4wv8-2f99) e minimatch (GHSA-g3hv-75wg-m249). Não equivale a auditoria integral.
- Homologação visual confirmada pelo desenvolvedor: Admin 6/6 (extrato, origem manual, métodos, atendimento, valores/saldos, desktop/mobile); Doctor 3/3 (escopo, recebimentos, restrições); Customer 4/4 (Meu financeiro, cobrança de R$ 200,00 do pet Teste, ausência de controles staff, fluxo anterior preservado).
- Etapa 4.2 concluída quanto à implementação, regressão automatizada e aceite visual. Sincronização com provedor, tentativas reais, pagamentos tardios, concorrência real e conciliação ponta a ponta continuam pendentes na 5.1; mocks não comprovam esses cenários.
- Versão 1.5.0 mantida até fechamento da 1.6.0; migration 0048 preservada. Nenhuma alteração de código, dependências ou banco neste checkpoint. Commit proposto: `feat(payments): add staff online payment monitoring` (ainda não confirmado).
- Próximo passo: 5.1 — preparação segura da homologação integrada. Manter `MERCADO_PAGO_ENABLED=false` e gate de criação fechado até verificar saldo esperado no servidor, credenciais/ambiente/recebedor, rotação do segredo de webhook e compatibilidade com 1.5.0 no banco compartilhado. Somente pet Teste (`c943e3cd-d2bb-4c19-a386-5a8e56899128`); limpeza posterior autorizada e conferida, nunca automática. Preservar pendência de revisão de PDFs assinados. Não fazer push/deploy.

Arquivos do bloco 4.2 (incluindo fix 01; checkpoint atual altera somente os seis Markdown):

- `AGENTS.md`
- `changelog.md`
- `docs/DEVELOPMENT_STATE.md`
- `docs/ROADMAP.md`
- `docs/SECURITY_AUDIT.md`
- `docs/TECHNICAL_DECISIONS.md`
- `src/api/actions/online-payment.actions.ts`
- `src/app/(protected)/appointments/_components/appointment-billing-editor.tsx`
- `src/app/(protected)/finance/_components/customer-charge-card.test.tsx`
- `src/app/(protected)/finance/_components/customer-charge-card.tsx`
- `src/app/(protected)/finance/_components/staff-online-payment-history.test.tsx`
- `src/app/(protected)/finance/_components/staff-online-payment-history.tsx`
- `src/app/(protected)/finance/customers/[id]/page.tsx`
- `src/lib/finance/billing-queries.ts`
- `src/lib/finance/financial-report-queries.ts`
- `src/lib/finance/financial-report.ts`
- `src/lib/finance/staff-online-payment-queries.test.ts`
- `src/lib/finance/staff-online-payment-queries.ts`
- `src/lib/finance/staff-online-payment.test.ts`
- `src/lib/finance/staff-online-payment.ts`
- `src/server/payments/staff-payment-sync.service.test.ts`
- `src/server/payments/staff-payment-sync.service.ts`

## 1.6.0 — etapa 4.2 — acompanhamento financeiro pela equipe (25/11/2026)

Entrega preparada, aguardando aplicação e validação local. Extrato do tutor pela equipe e financeiro do atendimento passam a distinguir origem manual/Mercado Pago e tentativas online dos recebimentos confirmados. Sincronização staff reutiliza conciliação, restringe Admin/Doctor pelo atendimento, ambiente e recebedor, verifica escopo do pet, reserva intervalo de 15 segundos e consulta o provedor fora da transação. Revisão financeira permanece bloqueada para baixa automática; dados de cartão, Pix e identificadores externos não são retornados. Configuração ausente mantém o financeiro manual disponível. Testes novos de escopo, autorização, sincronização, estados e interface preparados, não executados neste ambiente (dependências indisponíveis). Última evidência anterior: 954 testes/104 arquivos; erro de tipagem do checkout resolvido pelo desenvolvedor após atualização do TypeScript, sem alteração de fonte. Commit da interface informado: `feat(payments): add dedicated customer checkout`. Sem migration, dependências, alteração de banco ou versão (1.5.0); 0048 preservada. Manter gate de criação fechado, risco de banco compartilhado e pendências de segurança anteriores, inclusive rotação do segredo e revisão de PDFs. Validar instalação, formatação, check, Drizzle e auditorias; homologar Admin/Doctor/Customer e depois avançar à 5.1, incluindo concorrência real e pagamentos de teste. Não fazer push nem commit automático.

Arquivos de código desta entrega:

- `src/api/actions/online-payment.actions.ts`
- `src/app/(protected)/appointments/_components/appointment-billing-editor.tsx`
- `src/app/(protected)/finance/_components/customer-charge-card.test.tsx`
- `src/app/(protected)/finance/_components/customer-charge-card.tsx`
- `src/app/(protected)/finance/_components/staff-online-payment-history.test.tsx`
- `src/app/(protected)/finance/_components/staff-online-payment-history.tsx`
- `src/app/(protected)/finance/customers/[id]/page.tsx`
- `src/lib/finance/billing-queries.ts`
- `src/lib/finance/financial-report-queries.ts`
- `src/lib/finance/financial-report.ts`
- `src/lib/finance/staff-online-payment-queries.test.ts`
- `src/lib/finance/staff-online-payment-queries.ts`
- `src/lib/finance/staff-online-payment.test.ts`
- `src/lib/finance/staff-online-payment.ts`
- `src/server/payments/staff-payment-sync.service.test.ts`
- `src/server/payments/staff-payment-sync.service.ts`

# LovelyVet — estado do desenvolvimento

## Checkpoint vigente — 1.6.0 / interface 4.1 validada (25/11/2026)

Em 25/11/2026, o desenvolvedor enviou o resultado real da validação do ajuste de largura: 954 testes aprovados em 104 arquivos, duração 11,77 s; instalador concluído, Drizzle check aprovado e `pnpm audit --prod` sem vulnerabilidades conhecidas. Frozen lockfile, Prettier, ESLint e TypeScript foram aprovados pelo fluxo do instalador. Este resultado substitui as contagens previstas dos checkpoints anteriores; não equivale a homologação de pagamentos reais ou concorrência no PostgreSQL. Auditoria completa após instalação do SDK React ainda não foi apresentada; os dois advisories DEV (esbuild e minimatch) anteriormente aceitos devem ser reavaliados, sem presumir que o resultado permaneceu igual.

Interface 4.1A–C implementada e validada automaticamente: Pix, Card Payment Brick (SDK React 1.0.7), checkout dedicado com autorização por vínculo do tutor e cobrança, resumo e retorno preservando filtros, recuperação e sincronização. Prévia Pix desktop/mobile demonstrada; funcionamento do Brick e da página dedicada confirmado pelo desenvolvedor. Ajuste de largura aprovado pelos testes; confirmar visualmente desktop/mobile depois do ajuste e acesso direto a cobrança alheia, ainda sem evidência manual específica. Cobrança fictícia de R$ 200,00 do pet Teste disponível na última evidência. Não há evidência de Order válida ou conciliação real. Backend 2.2–3.3 implementado, incluído na suíte atual; homologação integrada pendente. Situação do Git informada é compatível com checkpoint 3.3 já separado, sem confirmação do hash desse commit. Revisar o conjunto de 25 arquivos da interface e registrar commit local; não presumir que já foi realizado.

Manter versão da aplicação 1.5.0 até release 1.6.0; migration 0048 aplicada e imutável; SDK backend 3.6.1 e SDK React 1.0.7. Lockfile novo gerado localmente; SHA-256 ainda não informado, preservar e conferir diff. Manter `MERCADO_PAGO_ENABLED=false` e gate de criação fechado. Banco compartilhado por aceite explícito; testes futuros somente no pet Teste, limpeza transacional posterior. Pendem verificação de saldo esperado no backend, confirmação da conta/ambiente com resposta real do provedor, concorrência e compatibilidade com 1.5.0 em produção, rotação do segredo de webhook anteriormente exposto (não confirmada), homologação financeira e recuperação. Não versionar segredos ou URL temporária. Não fazer push/deploy de funcionalidades incompletas.

Próximo bloco: 4.2 — acompanhamento pela equipe veterinária, com status das tentativas, origem dos recebimentos, sinalização de revisão e proteção de dados; preservar pagamentos manuais e escopo Admin/Doctor. Depois 5.1/5.2 — homologação integrada e auditoria; 6.1/6.2 — versionamento e publicação. Este checkpoint prevalece sobre registros históricos abaixo.

## Histórico — checkpoint — 1.6.0 / etapa 4.1C — ajuste de largura (25/11/2026)

O desenvolvedor confirmou o funcionamento da página dedicada e solicitou remover a centralização desnecessária; capturas desktop mostram a cobrança e o checkout com largura máxima. Removidos `mx-auto` e `max-w-6xl` do wrapper da página, utilizando toda a largura de `PageContent` com `w-full min-w-0`. Preservados padding padrão, proporção das duas colunas no desktop e resumo antes do formulário no mobile. Sem alteração do Brick, Pix, rotas, autorização, consultas, ledger, flags, dependências, migration 0048 ou versão 1.5.0.

Um teste de regressão estrutural de largura e disposição responsiva foi adicionado. Total previsto 954 testes/104 arquivos, condicionado à confirmação do baseline 953/104; último resumo comprovado 788/89. Capturas não comprovam a execução dos testes ou a homologação financeira. Validar Prettier, ESLint, TypeScript, Vitest, Drizzle e auditoria; conferir desktop/mobile após ajuste. Manter gate e MERCADO_PAGO_ENABLED=false, preservar cobrança fictícia, não fazer push/deploy. Pendências de segurança e homologação do checkpoint anterior permanecem. Próximo: fechar commit da interface após validação, confirmar checkpoint 3.3 e seguir etapa 4.2.

## Histórico — 1.6.0 / etapa 4.1C (25/11/2026)

4.1B: desenvolvedor confirmou funcionamento, mas preferiu evitar o scroll interno do modal; aprovou checkout em página dedicada. 4.1C entregue: `/my-finance/[chargeId]/payment` com navegação pelo cartão da cobrança, resumo à direita em desktop e acima do formulário em mobile, scroll natural, retorno preservando mês e escopo, Pix e Card Payment Brick reaproveitados, sincronização e trava de criação mantidas. Componentes e testes do modal substituídos pelos equivalentes da página; instalador remove somente os dois arquivos antigos previamente conferidos e guarda backup externo.

Segurança: rota protegida pelo Clerk e requirePageAccess, Customer com cadastro obrigatório, UUID validado, consulta financeira restrita simultaneamente ao ID e ao vínculo atual do tutor com o pet, ausência ou falta de autorização retorna 404, itens e opções usam as consultas autorizadas já existentes. Sem dados externos ou informações de cartão no resumo. Server Actions mantêm autorização própria. Cobrança quitada/indisponível sem opção não monta formulário. Não liberar MERCADO_PAGO_ENABLED; ainda pendem saldo esperado no backend, concorrência real, confirmação ambiente/recebedor, compatibilidade 1.5.0, rotação do segredo e homologação financeira no pet Teste. Nenhuma alteração de banco, migration 0048, versão 1.5.0 ou dependências; lockfile instalado localmente na 4.1B, hash novo ainda não informado. Manter lockfile e validar frozen-lockfile e auditoria. Não fazer push/deploy.

4.1C: sete testes novos de rota, três de permissões, três de escopo SQL e dois de recuperação na página; seis testes existentes do modal migrados. 953 testes/104 arquivos esperados se 938/103 da 4.1B confirmados; último resumo comprovado 788/89. Validação automatizada e visual local pendentes; mocks não substituem testes reais de BOLA/conciliação. Próximo: validar desktop/mobile, acesso por URL direta de outro tutor e retorno ao financeiro; confirmar contagem e auditoria, registrar checkpoint e commit da interface (confirmar também situação do commit 3.3). Depois 4.2 — acompanhamento pela equipe e preparação da homologação integrada. Seis Markdown atualizados; versão 1.6.0 somente no release.

## Histórico — checkpoint — 1.6.0 / etapa 4.1B (25/11/2026)

Etapa 4.1A: capturas desktop e iPhone 14 Plus demonstraram modal Pix, saldo de R$ 200,00, aviso de homologação e geração bloqueada. Não é homologação financeira. Etapa 4.1B entregue: opção de crédito, SDK React oficial 1.0.7 fixado (referência Vena Imports), carregamento sob demanda, tema claro, exclusão de débito e pré-pago, até 24 parcelas conforme schema atual, mesma ação de criação e fluxo de acompanhamento. A prévia oculta o botão do Brick e rejeita callback forçado; não inserir dados reais. Payload permite apenas token, método, parcelas e identificação opcional (além de ID da cobrança), sem PAN/CVV, BIN, e-mail do formulário ou valor enviado ao servidor. Tipo de cartão ausente/desconhecido é recusado. Sem logs de dados de cartão, sem setState síncrono em useEffect. A validação de valor no cliente não substitui a reserva no servidor: antes de abrir o gate, implementar confirmação do saldo esperado no backend contra alteração concorrente e validar comportamento real do SDK, método/ambiente/recebedor e concorrência com produção 1.5.0. Nenhuma migration, mudança de versão ou liberação de pagamentos. Manter MERCADO_PAGO_ENABLED=false. Secret do webhook exposto deve ser rotacionado (não confirmado). Último total comprovado 788/89; 924/101 previstos na 4.1A, 14 novos casos nesta entrega, 938/103 esperados se baseline confirmado. SDK e lockfile a resolver localmente via pnpm add --save-exact, auditoria obrigatória; não fazer push ou commit até validação. Próximo: 4.2 acompanhamento pela equipe e preparação da homologação integrada, com gate ainda fechado.

## Histórico — checkpoint — 1.6.0 / etapa 4.1A (25/11/2026)

Etapa 4.1A entregue para validação local: botão no portal do tutor, modal responsivo Pix, prévia explícita apenas no pet reservado quando o ambiente DEV está configurado, sincronização manual e periódica de tentativa própria, renderização PNG e Copia e Cola. A criação continua condicionada à flag e ao gate do backend (ainda fechado); nenhuma chamada de criação durante a prévia. A consulta minimiza dados, reusa escopo financeiro e filtra ambiente/recebedor, não entrega ID de tentativa de outro tutor. A autorização efetiva permanece nas Server Actions. Sem setState síncrono em useEffect. SDK React e Card Payment Brick ficam para 4.1B, assim como testes adicionais de acesso e concorrência real. Nenhuma alteração na migration 0048, dependências ou versão 1.5.0. Não fazer push/deploy.

Financeiro do Customer: consultas SQL e captura de tela confirmaram cobrança aberta de R$ 200,00 do pet reservado, três vínculos e identidade DEV; debug confirmou 1 lançamento antes/depois do filtro, saldo 20000 centavos, recebido zero, HTTP 200. Problema inicial não reproduzido; cache é hipótese, não causa comprovada. Remover console.info temporário antes de aplicar. Preservar cobrança para homologação e limpar dados fictícios antes do release. Último resumo comprovado 788/89; 908/99 esperados no checkpoint 3.3, commit desse checkpoint não confirmado. 16 novos casos previstos (924/101 se baseline confirmado). Validar localmente. Webhook sem assinatura 401 e simulação assinada chegou à conciliação com 500, causa específica não confirmada; rotação de segredo recomendada, não confirmada. Gate de criação só poderá ser aberto após validar conta/ambiente remoto e controles de concorrência e versão em produção. Não registrar segredos ou URL de túnel.

## Histórico — checkpoint — 1.6.0 / backend 2.2–3.3 e teste de webhook — 25/11/2026

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

## Histórico — checkpoint — 1.6.0 / etapas 1.1.1 e 1.1.2 (25/11/2026)

- Vena Imports: leitura estática de `src/lib/payments/mercado-pago.ts`, `src/server/payments/payment.service.ts`, `src/app/api/webhooks/mercado-pago/route.ts` e schema/estrutura na análise anterior. Cliente Orders singleton, idempotencyKey persistida e webhook assinado com consulta direta; referência externa atual por pedido, não tentativa. Não foram executados testes ou chamadas autenticadas.
- Direção técnica autorizada: Checkout Transparente com Orders, Pix e cartão de crédito, SDKs oficiais e Card Payment Brick. Débito desabilitado inicialmente; parcelamento a validar com provedor e regra comercial. Checkout Pro não é mais a direção vigente.
- Conta única por ambiente conforme decisão anterior. Variáveis propostas: `MERCADO_PAGO_ENABLED`, `MERCADO_PAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`, `MERCADO_PAGO_TEST_MODE`, `MERCADO_PAGO_WEBHOOK_SECRET`, `NEXT_PUBLIC_ENABLE_DEBIT_CARD`, `MERCADO_PAGO_COLLECTOR_ID`. Nenhum valor real configurado.
- Etapa 1.1.2 em andamento: roteiro de isolamento e diagnóstico somente leitura entregues. Banco de homologação ainda não criado nem verificado. Preferir instância separada, sem dados reais e sem credenciais de produção. Não assumir que nomes diferentes bastam para isolamento.
- Fonte LovelyVet: `src/db/index.ts` e `drizzle.config.ts` usam `DATABASE_URL`; journal termina em 0047. A cadeia de migrations existente não foi executada em banco vazio nesta revisão. Não criar/aplicar 0048 antes da modelagem e revisão. A última evidência de testes permanece 731/85, referente à 1.5.0.
- Entrega documental e operacional externa ao repositório; sem mudanças de código, dependências, schema, banco ou versão. Próximo passo: confirmar diagnóstico, provisionamento e histórico DEV antes de implementar ledger/tentativas.

## Histórico — checkpoint — 1.6.0 / arquitetura em definição (25/11/2026)

- Versão estável em produção: 1.5.0, homologação de 12/12 itens confirmada pelo desenvolvedor; último log local 731 testes/85 arquivos. Nenhuma validação de código nova nesta entrega.
- Etapa 1.1: decisão de conta recebedora confirmada. Homologação na conta do desenvolvedor usando credenciais de teste; produção na conta da esposa usando credenciais de produção. Um recebedor por ambiente, sem split ou marketplace.
- Checkout Pro hospedado, pagamento do saldo integral, Pix/cartão, feature flag, API REST e política de conciliação são propostas técnicas a detalhar, não implementações aprovadas. Fixar variante da API (Preferences ou Orders) antes de codificar.
- Bloqueio preventivo: banco atualmente compartilhado. Recomenda-se banco separado para homologação, com dados fictícios. Sem isolamento comprovado, nenhum pagamento de teste deve efetuar baixa no ledger compartilhado. Decisão de infraestrutura pendente.
- Próxima etapa após fechar regras: modelagem e revisão da migration 0048; não executar migration agora. Sem novos tokens, contas configuradas, webhooks, dependências, código ou versão alterados.
- Backlog de segurança da 1.5.0 preservado; ver SECURITY_AUDIT.md. O checkpoint de homologação a seguir é evidência histórica da versão estável.

## Histórico — checkpoint — release 1.5.0 em produção (25/11/2026)

- **Estado: 1.5.0 publicada e homologada.** Em 25/11/2026, o desenvolvedor confirmou expressamente a publicação e a aprovação dos 12 itens do checklist de produção. Evidência declaratória do desenvolvedor; não houve acesso independente ao ambiente, ao Git remoto ou aos logs de deploy. Hash do commit de release e URL/provedor não fornecidos; complementar quando disponíveis, sem inventar valores.
- Última validação local comprovada: 731 testes em 85 arquivos (19,29 s), frozen-lock, Prettier, ESLint sem warnings, TypeScript, Drizzle check e build Next 16.4.5/Turbopack aprovados. `pnpm audit --prod`: nenhuma vulnerabilidade conhecida; audit-all reprovado pelos dois advisories moderados DEV aceitos (esbuild e minimatch), sem novos alertas no último log. Lockfile SHA-256 `fdaf5809425bbd43a3cd0e2b3a6906e1d96db66977b4521ed7dd513efee0f406`. Sem nova execução nesta entrega documental.
- Limpeza 4.5 confirmada pelo desenvolvedor: histórico fictício do pet Teste (uma vacina, um vínculo de serviço e um atendimento previstos), preservando cadastro, foto e três vínculos com tutores. Backup e inventário posterior não apresentados. Não repetir SQL de limpeza nem a migration 0047, já aplicada anteriormente.
- Homologação em produção (12/12), conforme confirmação expressa do desenvolvedor:

    1. Deploy concluído com sucesso.
    2. Versão 1.5.0 exibida para Admin.
    3. Login Admin.
    4. Login Doctor.
    5. Login Customer.
    6. Dashboard e indicadores.
    7. Agendamentos e agenda.
    8. Novo layout dos detalhes do pet.
    9. Histórico clínico e Linha do Tempo.
    10. Receitas, assinatura digital e impressão.
    11. Financeiro e portal do tutor.
    12. Ausência de novos erros nos logs durante a homologação.

- O checklist confirma os fluxos listados, não uma auditoria integral, testes específicos de e-mail/mobile ou aceite explícito separado da política de acesso público aos PDFs assinados. Manter essas ressalvas no backlog, bem como a revisão financeira e de segurança complementar.
- Próxima ação: aplicar e versionar este fechamento documental em commit separado (`docs: record v1.5.0 production release`), conferir o Git e sincronizar pelo fluxo habitual. Não fazer novo commit de release, tag ou deploy automaticamente. Depois, iniciar planejamento da 1.6.0 (Mercado Pago) a partir da base mais recente, sem modificar o fluxo manual existente.

Os registros anteriores são históricos e refletem o conhecimento disponível na data de cada etapa; este checkpoint substitui instruções anteriores de retomada e bloqueios já resolvidos ou aceitos.

## Histórico — Checkpoint vigente — fechamento local 1.5.0 (25/11/2026)

- Revisão final aplicada no Mac. Frozen-lock, Prettier, ESLint sem warnings, TypeScript e Vitest 4.1.12 aprovados: **731 testes em 85 arquivos**, 19,29 s. Os 13 casos adicionais de HTML, busca de pets e cadastro de clientes passaram. Lockfile SHA-256 `fdaf5809425bbd43a3cd0e2b3a6906e1d96db66977b4521ed7dd513efee0f406`. Audit-prod sem vulnerabilidades conhecidas. Audit-all reprovado apenas por duas ocorrências moderadas DEV já aceitas expressamente; nenhuma nova ocorrência. Drizzle check aprovado e build Next 16.4.5/Turbopack aprovado (compilação 4,7 s, TypeScript 5,1 s, geração 24/24). Evidências do log enviado, não execução neste ambiente.
- Limpeza 4.5: pet Teste, UUID `c943e3cd-d2bb-4c19-a386-5a8e56899128`, banco `lovelyvet-application`. Inventário anterior: 1 pet, 3 vínculos com tutores, 1 atendimento, 1 item de serviço, 1 vacina; demais 12 indicadores de histórico zerados. Conferidas nove foreign keys no banco real. Escopo aprovado: preservar cadastro, foto, tutores e demais pets; limpar apenas histórico fictício. Desenvolvedor confirmou a conclusão da limpeza. Três exclusões previstas (vacina, vínculo de serviço e atendimento); não foi apresentado o log de execução, inventário posterior ou comprovante do backup. Não reexecutar o SQL; conferir estado pós-limpeza sem escrita se necessário. Nenhuma nova migration; 0047 já aplicada.
- Git status após revisão: 31 arquivos modificados e 8 novos, 39 no total. Últimos commits comprovados a242e84, 5e5bf2d e 5ccb794. Entrega exclusivamente documental; não altera código, dependências ou banco. Desenvolvedor solicitou commit e publicação. Preparar stage explícito e revisar diff; commit `release: v1.5.0`. Hash, push e deploy ainda não comprovados.
- Antes do push: confirmar política de acesso aos PDFs assinados por link (risco residual de acesso por portador do link), regressão manual mínima Admin/Doctor/Customer e mobile, assinatura/ITI, e-mail (Nodemailer 10), uploads, agenda e financeiro. O aceite desktop e a homologação das exclusões clínicas foram confirmados anteriormente; não há evidência individual dos demais fluxos no histórico disponível. Revisão estática foi focal, não auditoria integral/pentest. Não declarar homologação plena nem produção publicada sem evidência. Após deploy, registrar hash, ambiente, versão e homologação, mantendo backlog de riscos e 1.6.0 para depois.

## Histórico — Checkpoint vigente — revisão estática final, 25/11/2026

- ZIP completo recebido antes do commit: 399 arquivos TS/TSX/MTS contabilizados como TS/TSX (399 TS/TSX), 83 arquivos de teste, package.json 1.5.0, Next 16.4.5, Vitest 4.1.12, sem CLI Shadcn. Lockfile SHA-256 `fdaf5809425bbd43a3cd0e2b3a6906e1d96db66977b4521ed7dd513efee0f406`, igual ao log do checkpoint. Migration 0047 SHA-256 igual ao histórico; não reaplicar. Última validação comprovada: 718/83, audit-prod limpo, audit-all duas moderadas DEV, Drizzle check e build aprovados. Não reexecutados neste ambiente.
- O desenvolvedor aceitou expressamente, em 25/11/2026, manter temporariamente as duas ocorrências moderadas exclusivamente DEV: GHSA-67mh-4wv8-2f99 (esbuild via Drizzle Kit) e GHSA-g3hv-75wg-m249 (minimatch via TypeScript ESLint). Aguardar atualização compatível dos consumidores, sem forçar majors, sem ocultar advisories e sem expor servidores dev a terceiros. Aceite restrito a esses dois advisories, condicionado a audit-prod sem alertas e ausência de novos advisories ou mudança de gravidade/escopo. Audit-all continua com seu resultado real; qualquer alerta adicional bloqueia o release. Fixes transitivos existem segundo o log, mas a compatibilidade não foi demonstrada. Revisar no próximo ciclo de manutenção.
- Revisão estática focal em autorizações e consultas clínicas, billing, uploads, HTML armazenado, hooks, configuração/manifestos e schema. Encontradas e tratadas três classes de problemas: HTML legado em quatro pontos de renderização (sanitização e preservação da estrutura da receita), DOMParser global no SSR do catálogo, busca por nome de tutor alheio em pet compartilhado, e escrita de dados de usuário privilegiado por Doctor no cadastro de clientes. Doctor pode continuar editando contas Customer; Admin mantém acesso. Removido bloco HTML comentado residual do histórico. Sem mudança de dependências, layout V4, regras clínicas, banco, QR, PDF assinado ou migration.
- 13 testes adicionais previstos (4 HTML, 4 busca, 5 cadastro), total esperado 731 testes/85 arquivos. Validar Prettier, ESLint, TypeScript, Vitest, auditorias e build no Mac. Testes e build anteriores não validam este novo patch. Revisão não equivale a pentest nem auditoria exaustiva. Não há acesso ao banco, ambiente Clerk, SMTP ou Cloudinary real neste ambiente.
- Próxima ação: instalar pacote de revisão, enviar log e inventário SQL somente leitura. Limpeza dos registros fictícios será antes do commit; aprovar IDs, dependências, backup e transação explícita. Não excluir dados reais, PDFs assinados, pagamentos, cadastros/configurações ou identidades Clerk sem decisão específica. Não executar migration 0047. Política de acesso público por link e homologações manuais restantes não foram expressamente confirmadas pelo usuário no histórico disponível; solicitar confirmação específica antes do deploy. Após revisão e limpeza, revalidar, registrar resultados, preparar git add explícito e commit `release: v1.5.0`; deploy e homologação em produção ainda pendentes. Não iniciar 1.6.0.

## Histórico — Checkpoint prioritário — candidato 1.5.0 compilado (25/11/2026)

- Pacote auditoria-dev instalado no Mac com pnpm 12.21.0; remoção confirmada de shadcn 3.8.5 e 197 pacotes. Instalação estrita e frozen-lock aprovados; Prettier, ESLint sem warnings, TypeScript e Vitest 4.1.12 aprovados: 718 testes em 83 arquivos, 18,06 s. Os dois logs de falha de foto são cenários negativos esperados e as suítes passaram.
- Audit-prod: nenhuma vulnerabilidade conhecida. Audit-all: duas ocorrências moderadas (esbuild GHSA-67mh-4wv8-2f99 e minimatch GHSA-g3hv-75wg-m249); zero críticas/altas/baixas no relatório atual. Histórico: 150 -> 4 -> 2. Drizzle check aprovado; verifica consistência local, não aplica migrations nem prova estado do banco. Build Next 16.4.5/Turbopack aprovado, compilação 10,8 s, TypeScript 10,2 s, geração 24/24. O instalador retornou falha pelo gate audit-all; build e Drizzle check foram diagnósticos. Não houve publicação.
- Últimos commits confirmados: a242e84 (agendamentos SEC-003/004), 5e5bf2d (gestão administrativa Clerk) e 5ccb794 (provisionamento Clerk). Git status: 24 arquivos modificados e 5 novos, todos no bloco de registros clínicos, layout, preparação 1.5.0, dependências e documentação. Não há commit de encerramento 4.1.4 ou release confirmado. Revisar diff e stage explicitamente; não incluir arquivos locais desconhecidos.
- Este pacote registra evidências apenas, sem alterar código, manifestos, lockfile ou regras dos gates. Proposta para decisão do desenvolvedor: aceite temporário e explícito dos dois advisories DEV, condicionado a manter audit-prod limpo, sem novas ocorrências e sem expor servidores de desenvolvimento ou executar lint/Drizzle com entradas não confiáveis. Priorizar atualização compatível dos consumidores no próximo ciclo de manutenção; não usar overrides de major nem ignore para zerar o relatório. Sem aceite registrado, publicação permanece bloqueada.
- Antes de publicar: confirmar política de acesso por link a PDFs assinados (SEC-006), regressão manual mínima Admin/Doctor/Customer e mobile, assinatura/validação ITI, e-mail após Nodemailer 10, upload, agenda e financeiro; revisão integral restante ainda não comprovada. Identificar dados fictícios antes de qualquer exclusão ou decidir explicitamente adiar a limpeza. Não aplicar migration 0047 novamente. Após aceite, registrar decisões/pendências, commit revisado, publicação e homologação em produção. Não antecipar 1.6.0.

## Histórico — Checkpoint prioritário — auditoria residual de desenvolvimento (25/11/2026)

- Hotfix de peers aplicado e confirmado no Mac com pnpm 12.21.0. Instalação estrita, frozen-lock, Prettier, ESLint sem warnings, TypeScript e Vitest 4.1.12 aprovados: 718 testes em 83 arquivos, 19,11 s.
- Audit de produção: nenhuma vulnerabilidade conhecida. Audit completo: 4 ocorrências (1 alta, 3 moderadas, zero críticas), redução de 150 para 4. Zod 3 e @hono/node-server via Shadcn CLI; esbuild legado via Drizzle Kit; minimatch via Shadcn CLI e ESLint. Drizzle check e build não executados pelo gate anterior.
- Entrega `LovelyVet-1.5.0-auditoria-dev.zip`: retirar somente Shadcn CLI das devDependencies; no código de referência, não há importação do pacote nem script que o execute. Componentes UI e components.json preservados. Manter workspace, strict peers e lockfile real; não forçar majors de esbuild/minimatch. Conferir o código local antes de aplicar; CLI futuro deve ser avaliado e invocado sob demanda com versão auditada.
- Executar instalação, frozen-lock, format, check, audit-prod, audit-all, Drizzle check e build. Caso apenas audit-all falhe, rodar Drizzle check e build como diagnóstico local; manter retorno não zero e bloqueio de publicação. Não confundir sucesso de build com aceite de risco. Se restarem alertas, analisar caminhos/versões e eventual decisão explícita sobre risco residual de desenvolvimento; não registrar aceite presumido. Pendências manuais, SEC-006, revisão restante, identificação de dados fictícios, commits e deploy continuam abertas.

## Histórico — Checkpoint prioritário — hotfix de peer dependencies (25/11/2026)

- Saneamento inicial aplicado no Mac. A instalação baixou Next 16.4.5 e resolveu 73 adições/80 remoções, mas terminou com `ERR_PNPM_PEER_DEP_ISSUES`: node-forge instalado 1.4.4 versus exigido 1.4.3; Zod 3.25.76 (ferramentas) e 4.6.7 (aplicação) versus exigido 4.6.6. Não houve nova execução dos testes, auditorias, Drizzle check ou build. Última evidência: 718 testes/83 arquivos aprovados antes da atualização das dependências; audit anterior 150 ocorrências, cinco críticas.
- Hotfix: fixar dependências diretas node-forge 1.4.4 e Zod 4.6.7; remover somente os dois overrides globais que interferem nas faixas de peers; preservar compatibilidade do Zod 3 nas ferramentas, sujeito a nova auditoria. Manter instalação estrita. Não aprovar skills de terceiros automaticamente.
- Aplicar `LovelyVet-1.5.0-hotfix-peer-dependencies.zip` sobre o primeiro saneamento já aplicado. O lockfile pode ter sido modificado pela tentativa anterior; não substituir por lockfile antigo, guardar cópia do lockfile presente e regenerar com pnpm. Confirmar install, frozen-lock, format, check, audit-prod, audit-all, Drizzle check e build. Se houver falhas, não publicar. Não há nova contagem de testes nem auditoria aprovada. Pendências manuais, SEC-006 e revisão restante continuam abertas; commits e deploy não confirmados.

## Histórico — Checkpoint prioritário — auditoria bloqueou a publicação (25/11/2026)

- Preparação 1.5.0 aplicada; log do Mac: Prettier, ESLint sem warnings, TypeScript e Vitest aprovados; **718 testes em 83 arquivos**, 21,71 s. Layout final e testes dos PDFs/uploads incluídos. A contagem de 708 anterior era previsão, não execução isolada.
- `pnpm audit` falhou: 150 ocorrências (5 críticas, 43 altas, 81 moderadas, 21 baixas). Drizzle check e build não foram executados pelo instalador (gate interrompido). Nenhum deploy ou commit confirmado.
- Entrega de saneamento: atualizar versões diretas e transitivas selecionadas em `package.json` e `pnpm-workspace.yaml`; gerar lockfile real pelo pnpm no Mac, preservando backup e verificando a resolução. Os alvos são derivados do audit fornecido, não verificados no registry neste ambiente. Não forçar atualização principal de dependências transitivas incompatíveis.
- Próxima ação: instalar `LovelyVet-1.5.0-auditoria-dependencias.zip`, conferir logs de instalação, Prettier, lint, typecheck, Vitest, audit de produção e completo, Drizzle check e build. Qualquer falha bloqueia a publicação. Se persistirem alertas, analisar a árvore de dependências (especialmente minimatch, esbuild legado, Zod 3 e @hono/node-server 1), sem ignorá-los. Confirmar homologação mobile/Customer, ITI/PDF, e demais pendências do roadmap. Não aplicar migration nem excluir dados reais. Não iniciar 1.6.0.

Atualização: 2026-11-25 (America/Campo_Grande).

## Histórico — Checkpoint prioritário — preparação consolidada da 1.5.0

- O desenvolvedor pediu consolidar o fechamento em uma entrega (25/11/2026). Este pedido não altera as regras de acesso nem autoriza excluir dados reais ou marcar etapas sem evidência.
- `package.json` passa a 1.5.0 localmente; ainda não é release publicado. Changelog preparado. Pacote aceita V4 aprovada ou limpeza final já instalada.
- 4.1.4: política e exclusões homologadas; layout V4 aprovado no desktop. Último log comprovado 691/80. Previsão anterior 708/82; este pacote acrescenta 10 testes (4 PDF + 6 upload), previsão 718/83. Confirmar contagem real. Mobile/Customer e commit ainda não comprovados.
- 4.1.5: revisão estática inicial e cabeçalhos de privacidade implementados; acesso público a PDF por UUID/token e interoperabilidade ITI preservados. Política final, testes e homologação pendentes.
- 4.1.6: revisão focal de billing, consultas de extrato e uploads; reforço de upload da equipe implementado. Revisão completa e validação real pendentes.
- 4.1.7: auditoria de dependências será executada pelo instalador; não declarar resultado sem log. 4.2: ajustes pontuais de pluralização além do layout, não revisão integral. 4.3: limpeza do layout, não auditoria geral de código morto.
- 4.4: instalador executa format:check, check, audit (inclui dev), drizzle-kit check e build. Regressão manual continua necessária. 4.5: sem exclusão automática de dados, identificar e autorizar registros fictícios. 5.1/5.2: preparação local; 5.3: build a validar; 5.4/5.5: publicação e homologação em produção pendentes.
- Próxima ação: executar pacote `LovelyVet-1.5.0-preparacao-release.zip` e consultar relatório gerado fora do repositório; conferir `git status --short`, log de commits, aceitar política de PDF e validar regressão restante antes de publicar. Não iniciar 1.6.0. Não reaplicar migration 0047. Não executar commits/migrations/deploy automaticamente.

O checkpoint acima prevalece sobre os registros históricos abaixo; eles foram preservados para rastreabilidade. Não confundir a aprovação da V4 com a validação do pacote final.

## Base e evidências

- Código de referência: `LovelyVet.zip` atualizado, com `package.json` na versão 1.4.0 e migrations até 0047.
- Fonte histórica: documento recuperado "Continuidade do desenvolvimento — LovelyVet 1.5.0". O histórico integral do chat não foi recuperado, mas o cronograma e as decisões foram recuperados nesse documento.
- Diretório local: `/Users/eduardoranzzani/Desenvolvimento/personal/LovelyVet`.
- Pacotes: `/Users/eduardoranzzani/Downloads/LovelyVet`.
- Banco: `lovelyvet-application`. Development e Production compartilham PostgreSQL; Clerk separado por ambiente.

## Histórico — Checkpoint atual — 4.1.4

Segurança dos registros clínicos (SEC-005). Política compartilhada entre Admin e Doctor aprovada explicitamente em 25/11/2026. Implementação aplicada, suíte de 691 testes em 80 arquivos aprovada e homologação de exclusão confirmada. Correção visual de observações entregue no fechamento; validar novamente antes do commit. A 4.1.3 foi homologada; o desenvolvedor autorizou continuar, mas a execução/hash dos commits anteriores não foi confirmado.

- [x] 4.0 — Prettier, EditorConfig e ESLint; 585 testes conforme histórico.
- [x] 4.1.1 — Inventário de segurança.
- [x] 4.1.2 — Segurança Clerk e correção Vitest.
- [x] 4.1.2.1 — Central `/admin` funcionando conforme confirmação do desenvolvedor.
- [x] 4.1.2.2 — Migration 0047 aplicada e validada em 25/11/2026.
- 4.1.2.3 — Suíte aprovada: 79 arquivos, 639 testes, Prettier, ESLint sem warnings e TypeScript; 16,31 s (log do Mac, 25/11/2026). O desenvolvedor informou que faltava apenas o commit e autorizou seguir. Comandos de commit fornecidos; hash/execução do commit não confirmados. Verificar no Git sem repetir homologações já realizadas.
- [x] 4.1.3 — Aplicação, validação automatizada e homologação funcional concluídas.
- [ ] 4.1.3 — Commit de fechamento: comandos fornecidos, execução/hash não confirmados.
- [x] 4.1.4.1 — Política de exclusão clínica compartilhada aprovada.
- [x] 4.1.4 — Aplicação, testes automatizados e homologação funcional da política de exclusão.
- [ ] 4.1.4 — Validar hotfix de renderização de observações e realizar commit de fechamento.

## Última migration confirmada

- Arquivo: `drizzle/0047_clerk_identity_link_audit.sql`.
- Tabela: `public.clerk_identity_link_audit`.
- SHA-256: `89268b537bee11cec5364f6a01ae7ba03abe8d443c4dede9a7d3ee234beb939e` (recalculado a partir do ZIP e compatível com o histórico).
- ID no histórico: 15; `created_at`: 1795550000000.
- Migration 0046 preservada (ID 14; `created_at`: 1795520000000).
- Total inicial de registros: 0 (evidência histórica, não contagem atual).
- Não reaplicar 0047. Não usar `drizzle-kit push` para este fluxo.

## Histórico — Próximas ações exatas

1. Aplicar `LovelyVet-preview-layout-pet-final.zip` sobre a v4 instalada e aprovada visualmente pelo desenvolvedor. Remove backup comentado e modos de layout legado; não muda a apresentação aprovada. Confirmar Prettier, ESLint, TypeScript e Vitest (708 testes em 82 arquivos previstos, última contagem real 691/80).
2. Conferir regressão visual desktop e telas menores, perfil Customer (somente Linha do Tempo, sem observações internas ou exclusão, com edição exclusiva da foto) e formatação de observações fictícias. Aceite visual desktop confirmado; demais cenários ainda sem evidência específica.
3. Verificar `git status --short` e `git log -3 --oneline`; preparar fechamento e commit(s) do bloco 4.1.4 e layout, sem ZIPs. Confirmar hashes dos commits anteriores e novos. Atualizar este checkpoint com a saída efetiva da suíte e o estado do Git.
4. Próxima etapa de segurança: **4.1.5 — Segurança das receitas e PDFs (SEC-006)**, após fechamento. Não iniciar Mercado Pago. Demais revisões da 4.2 continuam pendentes.

## Evidências da homologação 4.1.3 (25/11/2026)

- Instalador e validações automatizadas aprovados conforme relato do desenvolvedor ("rodou ok"). Sem log detalhado isolado da etapa: 661 testes em 80 arquivos são inferidos do log posterior de 691/80 e dos 30 casos adicionais da 4.1.4.
- O desenvolvedor confirmou expressamente a homologação dos oito fluxos: criação como Admin, edição como Doctor, reagendamento pendente, reagendamento confirmado, confirmação/conclusão/cancelamento, exclusão fictícia, criação como Customer e disponibilidade no reagendamento.
- Não há evidência separada de teste manual negativo de IDs alheios ou de concorrência real; estes cenários foram contemplados na implementação/testes automatizados.
- Nenhuma migration nesta etapa; 0047 permanece a última confirmada.
- Commit ainda não executado por este assistente. A próxima conversa deve verificar o Git antes de tratar a etapa como encerrada no versionamento.

## Entregas anteriores do bloco Clerk

- `LovelyVet-etapa-4.1.2-seguranca-identidades-clerk.zip`
- `LovelyVet-etapa-4.1.2-correcao-vitest.zip`
- `LovelyVet-etapa-4.1.2.1-gerenciamento-identidades-clerk.zip`

## Entrega 4.1.3

- `src/api/actions/appointments.actions.ts`: escopo da exclusão na disponibilidade, autorização após trava e gravações condicionadas ao escopo; consulta de lembrete na transação de conclusão.
- `src/lib/security/appointment-access.ts`: leitura com executor transacional, trava do agendamento e vínculo do tutor.
- `src/lib/security/pet-access.ts`: leitura de acesso ao pet pelo executor transacional.
- `src/api/actions/appointments.actions.test.ts` e `src/lib/security/appointment-access.test.ts`: 22 novos casos previstos; testes de ações existentes adaptados às transações.
- Documentação de estado, roadmap, decisões e auditoria atualizada.

## Limitações

A sintaxe dos arquivos TypeScript foi verificada por transpileModule; não substitui typecheck nem testes. Dependências e configuração Prettier local não estavam disponíveis neste ambiente. O instalador usa o Prettier efetivo do projeto antes de aplicar os arquivos. Não houve consulta ao PostgreSQL nem teste real de concorrência. A revalidação usa o contexto autenticado da requisição, não uma nova consulta de papel/identidade Clerk; revogação global de identidade durante uma requisição e outros fluxos financeiros/clínicos não integram esta correção. Banco compartilhado continua sendo risco. SEC-003/004 corrigidas e homologadas no escopo da etapa; riscos residuais permanecem registrados. Não confundir homologação funcional com teste real de concorrência ou auditoria integral.

## Entrega 4.1.4 — SEC-005

- `src/api/actions/timeline.actions.ts`: manter `requireStaff` sem restrição de autoria; exclusão de pesagem, observação e documentos por ID/pet/tipo com `returning`; travar vacina e receita com `FOR UPDATE`; verificar assinatura dentro da transação e impedir exclusão de vacina vinculada no predicado da escrita; remover lembretes atomicamente e rejeitar ausência de linha.
- `src/api/schema/timeline.schema.ts`: regra de apresentação por papel, tipo, ID e `canDelete`; sem mudança na validação de entrada da Server Action.
- `src/app/(protected)/pets/_components/pet-details.tsx`: impedir acionamento e ocultar exclusão de itens protegidos, inclusive vacina ligada a atendimento; manter histórico compartilhado.
- `src/api/actions/timeline.actions.test.ts` e `src/api/schema/timeline.schema.test.ts`: testes de regressão revisados/expandidos, saldo previsto de 30 casos (31 substituem 14 na ação; 13 adicionais no schema).
- Sem migration. Não executado typecheck completo, Vitest nem concorrência real no ambiente do assistente. A política de leitura/edição, assinatura de PDFs e auditoria de exclusões não foi alterada. A autorização usa AuthContext da requisição.

## Evidências da homologação 4.1.4 (25/11/2026)

- Log real do Mac: Prettier, ESLint sem warnings, TypeScript e Vitest aprovados. 691 testes em 80 arquivos, 17,40 s. Suítes timeline.actions: 31; timeline.schema: 25; appointments.actions: 71; appointment-access: 8.
- Desenvolvedor confirmou a homologação funcional da exclusão. Prints mostram exclusão bem-sucedida e observação com HTML literal. Modal de vacina cria registro ligado a atendimento por padrão; ausência de exclusão está correta. Não inferir teste manual isolado de vacina avulsa ou concorrência real; proteções automatizadas presentes.
- Hotfix entregue: `ClinicalNoteContent` renderiza texto rico sanitizado com `sanitizeRichTextHtml`, usando `rich-text-content` existente. Não modifica armazenamento, autorização, filtragem de dados do Customer nem outras renderizações. Três testes novos previstos; ainda não executados neste ambiente.
- Redesign proposto: cabeçalho compacto, histórico com largura total, ações agrupadas, filtros e rolagem natural. Proposta original revisada: manter os sete botões coloridos, sem menu de cadastro, conforme preferência da equipe clínica.

## Preview de layout dos detalhes do pet (antecipação pontual da 4.2)

Pacote `LovelyVet-preview-layout-pet.zip`, aplicar somente após o fechamento 4.1.4 (hotfix de observações). Cabeçalho compacto, dados expansíveis, peso em destaque e ações coloridas acima do histórico com largura integral e rolagem natural. Backup comentado integral do componente anterior em `pet-details.tsx`; componentes filhos mantêm layout legado por padrão. Cinco testes adicionais previstos: 699 testes em 82 arquivos após ambos os pacotes; última evidência real 691/80. Sem mudança de regra de negócio, migration ou commit automático. Homologar desktop/mobile, perfis e botões; remover backup comentado após aprovação definitiva ou restaurar conforme README. Commit do redesign separado do bloco de segurança.

## Validação do preview — hotfix de tipagem

- O desenvolvedor confirmou a instalação do preview e aprovação de Prettier e ESLint. TypeScript interrompeu `pnpm check` na linha 55 de `tab-history.test.tsx`: TS2769, opção `exact` inexistente em `ByRoleOptions`. Vitest não executado nesta tentativa.
- Hotfix `LovelyVet-preview-layout-pet-hotfix-test.zip`: remover somente `exact: true` da consulta `getByRole` no teste; o nome textual continua com correspondência exata. Layout, backup comentado e regras clínicas permanecem intactos.
- Próxima ação: aplicar o hotfix e confirmar `pnpm format:check` e `pnpm check` (699 testes em 82 arquivos previstos); avaliar visualmente o layout. Não commitar antes da validação e homologação.

## Preview v2 — 25/11/2026

Preview v2: cabeçalho original (foto grande e cadastro aberto), sete ações de largura/altura uniforme, painel compartilhado entre Histórico e Linha do Tempo sem altura limitada. Abas provisórias preservadas com apresentação uniforme; Customer só monta Linha do Tempo, sem ações de staff, edição cadastral ou endereço, mantém modal de foto; observações também omitidas na montagem cliente. Backup comentado original preservado. Aplicar após hotfix de tipagem do preview v1. Sete novos testes previstos (706 em 82 arquivos); não há log de execução do hotfix nem da v2. Homologar desktop/mobile e perfis Admin, Doctor e Customer antes do commit; fechamento 4.1.4 ainda a confirmar no Git. Nenhuma alteração de banco ou Server Action.

## Preview v3 — 25/11/2026

O desenvolvedor visualizou a v2 e reprovou o tamanho/distribuição dos botões. A observação de exemplo aparece como texto formatado sem tags literais no print. Aprovou manter cabeçalho original e ações coloridas compactas, com divisão 50/50 em telas grandes e empilhamento em telas menores. A v3 altera somente `tabs/tab-history.tsx` e seus testes: duas colunas iguais a partir de `2xl` (1536 px no tema padrão), grade compacta limitada a `max-w-xl` com até três colunas conforme espaço disponível e altura uniforme de 44 px para botões e link, inclusive gatilhos de modal. Histórico continua sem limite interno de altura; Linha do Tempo e demais abas mantêm o painel da v2. Customer permanece somente com Linha do Tempo em leitura e edição exclusiva da foto. `pet-details.tsx` e seu backup comentado não são modificados.

Próxima ação: aplicar `LovelyVet-preview-layout-pet-v3.zip` sobre a v2, executar `pnpm format:check` e `pnpm check`, conferir layout desktop (50/50), telas menores (ações acima), sete ações sem cortes e visibilidade por perfil. Dois novos testes de estrutura/seletores previstos (708 em 82 arquivos, se o baseline de 706 estiver correto); última evidência numérica real permanece 691 em 80 arquivos. Não confundir teste estrutural com verificação de CSS em navegador. Sem migration nem commit automático; fechar 4.1.4 e preview somente após validação e aceite. Próxima etapa de segurança: 4.1.5.

## Preview v4 — 25/11/2026

O print da v3 confirma a divisão 50/50 e os botões de altura uniforme, mas mostra espaço horizontal não utilizado na coluna esquerda. O desenvolvedor solicitou preencher essa coluna. Removido `max-w-xl` do grid expandido de ações; mantido `w-full`, com uma coluna por padrão, duas a partir de `sm` e três a partir de `lg`. A divisão 50/50 a partir de `2xl`, a altura de 44 px e as regras do Customer permanecem intactas. O sétimo botão ocupa uma célula normal. Teste estrutural existente atualizado, sem novos casos: total previsto 708 em 82 arquivos, não confirmado por log. Aplicar v4 sobre v3, validar e homologar antes do commit.

## Aceite visual da v4 e limpeza final — 25/11/2026

O desenvolvedor aprovou expressamente a v4 no desktop e autorizou remover o backup comentado. Mantido o cabeçalho original, as sete ações coloridas preenchendo a coluna esquerda, histórico à direita (50/50 em 2xl) e empilhamento abaixo. Limpeza entregue: remover o bloco comentado de `pet-details.tsx` e os modos temporários de reversão `expandedLayout`/`framed` dos componentes envolvidos; adotar permanentemente a configuração aprovada. Dois testes de reversão substituídos por regressões do padrão definitivo, sem alterar a contagem prevista de 708 testes. Backup externo do instalador preservado. Não há log da suíte pós-preview nem confirmação específica de homologação mobile/Customer; commit ainda pendente.

## Checkpoint 4.2 — 2026-11-26 (fix 01)

- Validação local informada: Prettier, ESLint e TypeScript aprovados; Vitest: 982/983 testes, 107/108 arquivos, 11,02 s.
- Fix no teste `src/server/payments/staff-payment-sync.service.test.ts`: verificar o retorno do serviço, não o retorno indefinido do mock de conciliação. Mantidas as verificações de transação e privacidade.
- Reexecução da suíte, Drizzle check, auditoria e homologação visual pendentes; etapa 4.2 ainda não encerrada. Sem alterações de runtime, migration, versão ou banco.

## Checkpoint 5.1A-01 — 2026-11-26

- Etapa 4.2 encerrada: 983 testes em 108 arquivos, Prettier, ESLint, TypeScript, Drizzle check e auditoria de produção aprovados conforme confirmação local; aceite visual Admin (6/6), Doctor (3/3) e Customer (4/4). Commit `feat(payments): add staff online payment monitoring` confirmado pelo desenvolvedor; hash não informado. Este checkpoint prevalece sobre registros históricos de pendências da etapa 4.2 de pagamentos.
- DEV: credenciais renovadas, segredo do webhook rotacionado e Cloudflare Tunnel configurado conforme relato do desenvolvedor; autenticação com as novas credenciais ainda não verificada.
- 5.1A-01: cartão exige `expectedBalanceInCents` inteiro positivo seguro, usado exclusivamente como precondição. Saldo recalculado sob lock existente; divergência impede reserva e chamada externa. Pix preservado. Brick remontado quando cobrança/saldo apresentado muda. O campo não é encaminhado ao Mercado Pago.
- Testes de schema, payload, componentes, regra de saldo e orquestração atualizados. Validação Node/pnpm/Vitest ainda pendente localmente; concorrência real no PostgreSQL não comprovada por mocks.
- Sem mudanças em migrations (0048), versão (1.5.0), dependências, banco ou gate de criação. Manter `MERCADO_PAGO_ENABLED=false`. Dois alertas DEV conhecidos (esbuild e minimatch) permanecem aceitos temporariamente; reavaliar auditoria local.
- Próximos passos: validar 5.1A-01, revisar credenciais/recebedor e liberação DEV (5.1A-02), homologar Pix e cartão, concorrência, segurança e limpeza controlada. Não executar push para master.

Arquivos de código e testes alterados:

- `src/api/schema/online-payment.schema.ts`
- `src/api/schema/online-payment.schema.test.ts`
- `src/lib/finance/online-card-payment.ts`
- `src/lib/finance/online-card-payment.test.ts`
- `src/app/(protected)/my-finance/_components/online-card-payment-brick.test.tsx`
- `src/app/(protected)/my-finance/_components/online-payment-checkout.test.tsx`
- `src/lib/finance/online-payment-reservation.ts`
- `src/server/payments/payment.service.ts`
- `src/lib/finance/online-payment-reservation.test.ts`
- `src/server/payments/payment-orchestrator.test.ts`
- `src/app/(protected)/my-finance/_components/online-payment-checkout.tsx`

## Checkpoint 5.1A-02 — 2026-11-26

- 5.1A-01 aprovada localmente: 996 testes em 108 arquivos (13,25 s), instalação congelada, Prettier, ESLint, TypeScript, Drizzle check e auditoria PROD aprovados; somente dois alertas DEV conhecidos (esbuild e minimatch). Commit `fix(payments): prevent stale balance during card checkout` solicitado e continuidade autorizada; hash não informado.
- 5.1A-02 implementada, aguardando validações locais. Gate temporário permite novas Orders somente com flag habilitada, configuração Mercado Pago teste/Clerk development e `NODE_ENV=development` (`pnpm dev`). Builds de produção continuam bloqueados. A UI usa o mesmo gate local; a verificação remota não é realizada na renderização.
- Antes de reservar: verificar vínculo do tutor e UUID exclusivo do pet Teste, consultar `GET https://api.mercadolibre.com/users/me` com Bearer no header, sem cache, sem redirecionamento e timeout de 10 s. Exigir ID correspondente ao Collector ID e tag `test_user`; respostas ausentes/inesperadas bloqueiam criação. A tag é uma precondição conservadora cuja disponibilidade real precisa ser conferida; não é prova isolada do ambiente da credencial. Confirmar credenciais de Teste no painel. Não expor payload ou erros remotos. Revalidar acesso e escopo sob lock antes da reserva; nenhuma rede dentro da transação. Conciliação e recuperação permanecem independentes da flag.
- Referência oficial: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/resources/credentials (prefixo APP_USR não distingue ambiente; exemplo users/me). A conta recebedora de teste é dedicada. Não usar cartão real nem pagar QR com conta real.
- Código/testes: `src/lib/integrations/mercado-pago-config.ts`, `src/lib/integrations/mercado-pago-config.test.ts`, `src/server/payments/payment.service.ts`, `src/server/payments/payment.service.test.ts`, `src/lib/finance/online-payment-options.ts`. Previsão: 1011 testes em 108 arquivos; não executados neste ambiente. Sem mudanças de dependências, versão 1.5.0, migration 0048, banco ou configuração de ambiente.
- Manter `MERCADO_PAGO_ENABLED=false` até aprovação da suíte, verificação remota somente leitura e confirmação de isolamento operacional: não operar o pet Teste na versão 1.5.0 de produção durante homologação (compatibilidade do código implantado não verificada). Não criar tentativas externas ainda. Após aprovação, habilitar somente DEV para etapa 5.1B Pix. Pendências: autenticação real do webhook renovado, homologação Pix/cartão, concorrência PostgreSQL real, compatibilidade 1.5.0, limpeza transacional aprovada, segurança e publicação. Não fazer push para master.

## Checkpoint de aceite 5.1A — 2026-11-26

Este checkpoint prevalece sobre as pendências de validação automatizada e preflight registradas anteriormente para a etapa 5.1A-02.

- 5.1A-01: 996 testes aprovados em 108 arquivos (13,25 s); commit `fix(payments): prevent stale balance during card checkout` seguido de autorização para continuidade; hash não informado.
- 5.1A-02: validação local confirmada pelo desenvolvedor: 1011/1011 testes em 108/108 arquivos (11,15 s), Drizzle check aprovado e auditoria PROD sem vulnerabilidades conhecidas. Prettier, ESLint e TypeScript precedem o Vitest no comando do instalador e não bloquearam sua execução.
- Auditoria completa: somente dois alertas moderados DEV já aceitos temporariamente, esbuild (GHSA-67mh-4wv8-2f99) e minimatch (GHSA-g3hv-75wg-m249). Não atualizar dependências especulativamente.
- Preflight autenticado somente leitura em `GET https://api.mercadolibre.com/users/me`: Collector ID corresponde: true; conta marcada como teste: true; preflight aprovado, conforme saída local fornecida. Nenhuma Order criada por esse procedimento. A tag `test_user` não comprova isoladamente o ambiente da credencial; confirmar uso das credenciais de Teste no painel Mercado Pago antes de criar Orders.
- Credenciais renovadas, segredo do webhook rotacionado e Cloudflare Tunnel configurado conforme confirmação anterior do desenvolvedor. Autenticação real de notificações com o novo segredo e funcionamento da Public Key ainda não homologados.
- Etapa 5.1A: implementação e validações automatizadas/preflight concluídos; commit 5.1A-02 pendente (`feat(payments): enable controlled development payment testing`). Próxima etapa: 5.1B, homologação Pix, após commit e confirmação operacional de isolamento do pet Teste em produção.
- Manter `MERCADO_PAGO_ENABLED=false` até confirmar credenciais de Teste e impedir operações financeiras sobre o pet Teste na versão 1.5.0 de produção durante homologação. Depois habilitar somente DEV (`pnpm dev`, Clerk development, modo teste), exclusivamente para o UUID `c943e3cd-d2bb-4c19-a386-5a8e56899128`. Não pagar QR com conta real. Não fazer push para master.
- Pendências: Pix/cartão ponta a ponta, webhook renovado, concorrência real PostgreSQL, compatibilidade com a versão 1.5.0 no banco compartilhado, limpeza transacional previamente aprovada, auditoria complementar e release. Mocks não comprovam concorrência real.
- Este pacote modifica somente os seis Markdown obrigatórios. Sem alterações de código, testes, dependências, migration 0048, versão 1.5.0, banco ou ambiente. Não executa commit, push ou migration. Validações anteriores referem-se ao pacote 5.1A-02 executado localmente; nova execução do instalador de checkpoint permanece pendente.

## Checkpoint 5.1B — Fix 01 — 2026-11-26

Este checkpoint prevalece sobre as pendências anteriores de commit e homologação Pix.

- 5.1A concluída; commit confirmado pelo desenvolvedor (hash não informado). Última suíte confirmada: 1011/1011 testes, 108 arquivos, 11,15 s; Drizzle check aprovado; auditoria PROD sem vulnerabilidades conhecidas; dois alertas DEV moderados anteriormente aceitos (esbuild e minimatch).
- Homologação Pix: pagamento manual fictício de R$ 100 seguido de Pix de R$ 100, aprovado e conciliado; limpeza transacional local posteriormente conferida. Novo Pix integral de R$ 200 no pet Teste (UUID autorizado): tentativa `test`, `approved`, provedor `processed/accredited`, sem motivo de revisão, um recebimento `mercado_pago` vinculado de 20000 centavos, saldo zerado na interface; 18,002 s entre criação e aprovação registradas. Webhook autenticado e idempotência reportados pelo desenvolvedor. `expires_at` nulo. Não há QR persistido. Não confundir observação do ledger com prova de concorrência real.
- Diagnóstico: `APRO` simula aprovação automática; consulta anterior aguardava polling de 15 s; leitura do Pix descartava todo o código quando o PNG não era válido. A resposta inicial real não foi capturada, portanto não se comprova qual dessas condições causou a ausência nesta Order. O exemplo oficial omite `total_paid_amount` e traz Base64 vazio.
- Fix: consulta GET autenticada imediata após criação Pix pela ação interna, somente quando a Order é conhecida, com reautorização e reserva de consulta existentes; exceção ao cooldown limitada ao fluxo interno de criação, não disponível na ação pública de sincronização. Consultas seguintes mantêm 15 s. Nenhuma criação adicional por falha da consulta. Código Pix textual validado por formato/tamanho (não é validação completa EMV); PNG válido do provedor ou geração local `qrcode` já instalada, fora da transação, margem de quatro módulos; falha de geração preserva Copia e Cola. Não expor dados Pix da equipe/outros tutores, payload bruto, URL ou tokens. Exibir somente pendente reautorizado. Não atrasar aprovação.
- Validade: persistir `transactions.payments[].date_of_expiration` absoluta ISO com fuso, quando presente e válida em Pix pendente após política de conciliação; não inferir prazo por `expiration_time` da Order automática nem transicionar status pelo relógio local. Mostrar ausência de prazo se não informado.
- Referências oficiais: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/integration-test/pix ; https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration/websites/pix ; https://www.mercadopago.com.br/developers/en/reference/online-payments/checkout-api/create-order/post .
- Fix entregue, validações Node locais pendentes; não considerar QR, Copia e Cola, validade ou expiração homologados. Testes novos de leitura sem Base64, PNG inválido/ausente, ausência de total pago no pending, validade, estados finais, geração local/falha, consulta inicial e apresentação/remoção do código na UI.
- Manter versão 1.5.0, migration 0048 e dependências. Não alterar banco, não executar migration, não realizar commit/push automaticamente. Manter integração desabilitada até aprovação. Preservar o Pix integral aprovado até backup e confirmação remota; nova limpeza precisa de SQL ajustado para um recebimento de 20000, não reutilizar script anterior de dois recebimentos.
- Próximos passos: validar fix; conferir histórico Admin; limpar somente o pet Teste após autorização e backup; novo Pix em DEV; validar QR/Copia e Cola antes da aprovação automática, expiração se suportada no sandbox (caso contrário documentar limitação e testar por fixtures), cartão 5.1C, concorrência real e recuperação 5.1D, limpeza 5.1E, segurança 5.2, documentação e release 6.1/6.2. Não operar o pet Teste em PROD durante homologação.

Arquivos de código e testes alterados neste fix:

- `src/api/actions/online-payment.actions.ts`
- `src/app/(protected)/my-finance/_components/online-payment-checkout.test.tsx`
- `src/app/(protected)/my-finance/_components/online-payment-checkout.tsx`
- `src/server/payments/payment-recovery.service.test.ts`
- `src/server/payments/payment-recovery.service.ts`
- `src/server/payments/reconciliation.service.test.ts`
- `src/server/payments/reconciliation.service.ts`
- `src/server/payments/recovery-policy.test.ts`
- `src/server/payments/recovery-policy.ts`

## Checkpoint 2026-11-26 — 5.1B Fix 02 (resumo do tutor)

- Fix 01: 1.029 testes em 108 arquivos aprovados localmente; Prettier, ESLint, TypeScript, Drizzle check e auditoria PROD aprovados. Permanecem os dois alertas DEV conhecidos.
- Homologação funcional do Pix após Fix 01: 10/10 cenários aprovados pelo usuário, incluindo QR Code, Copia e Cola, quitação e saldo. Expiração efetiva sem pagamento ainda pendente.
- Fix 02: Meu financeiro apresenta Total em atendimentos, Total pago no mês e Cobranças em aberto (histórico completo). Reutiliza outstandingCount do relatório autorizado; sem mudanças de autorização, cálculo, persistência ou indicadores da equipe.
- Arquivos: `src/app/(protected)/my-finance/page.tsx`, `src/app/(protected)/finance/_components/finance-summary-cards.tsx` e `src/app/(protected)/finance/_components/finance-summary-cards.test.tsx`. Dois testes de interface adicionados; execução local pendente (esperados 1.031 testes).
- Versão 1.5.0, migration 0048, sem dependências novas. Sem commit do Fix 01/02 confirmado; validar e conferir interface antes do commit. Não fazer push.
- Próximos passos: fechar conferência Admin, registrar limitação ou homologar expiração efetiva do Pix, commit e homologação de cartão.

## Checkpoint 2026-11-26 — fechamento 5.1B e reconciliação documental

- Este checkpoint atualiza as pendências históricas acima: Fixes 01 e 02 aprovados, 1.031 testes em 108 arquivos, Prettier, ESLint, TypeScript, Drizzle check e auditoria PROD aprovados. Última auditoria DEV completa: dois alertas moderados conhecidos (esbuild e minimatch).
- Pix parcial seguido de online e Pix integral homologados; QR Code, Copia e Cola e tratamento da informação de expiração aprovados (10/10); conferência financeira Admin aprovada (8/8), com um recebimento de R$ 200 e saldo zero. Expiração efetiva sem pagamento permanece pendente em 5.1D.
- Indicadores Customer: Total em atendimentos, Total pago no mês, Saldo total em aberto e Cobranças em aberto; visual Admin e Customer aprovados.
- Commit `ea619e9` confirmado (18 arquivos). O instalador do checkpoint anterior rejeitou divergências documentais; esta revisão usa os seis arquivos locais exportados como base, preservando seu histórico.
- Limpeza de homologação anterior confirmada pelos registros posteriores; tentativa de cartão recusado em revisão deve permanecer preservada. Webhook da recusa respondeu HTTP 200; isso não comprova conciliação correta. Avisos de montagem do Brick observados antes do Pix são uma investigação separada; causa ainda não confirmada.

## Checkpoint 2026-11-26 — 5.1C Fix 01 (recusa de cartão)

- Base validada: 1.031 testes em 108 arquivos; Pix funcional e indicadores Admin/Customer aprovados. Última auditoria PROD sem alertas; dois alertas DEV conhecidos na última auditoria completa.
- Homologação cartão: Order de teste recusada pelo emissor (failed/failed na Order; failed/rejected_by_issuer na transação), valor solicitado R$ 200 e total pago zero segundo painel; tentativa local em review/remote_status_review, sem IDs remotos persistidos. Saldo exibido R$ 200.
- Correção: `src/server/payments/reconciliation-policy.ts` diferencia detalhes conhecidos de recusa da transação de cartão, preservando validação da identidade, valor, método, ambiente, ausência de estornos e concordância terminal com total pago zero. Falhas desconhecidas, processing_error e high_risk continuam em revisão. Revisão anterior não é desfeita automaticamente.
- `src/server/payments/reconciliation-policy.test.ts`: 13 cenários acrescentados; esperados 1.044 testes em 108 arquivos, execução local pendente. A interface já contém mensagem de recusa e ação de nova tentativa condicionada à elegibilidade do servidor. Sem alterações de interface neste pacote.
- A tentativa já em revisão deve ser preservada até consulta autenticada remota e resolução controlada; não alterar status apenas pelo webhook ou painel. Não há comprovação da causa da ausência de IDs na resposta inicial.
- Próximos passos: validar fix, consultar Order existente, resolver tentativa de teste com segurança, repetir recusa, homologar cartão aprovado e parcelado. Expiração Pix e concorrência real permanecem pendentes.
- Versão 1.5.0, release 1.6.0, migration 0048; sem dependências, alterações de banco ou commit automáticos. Commit 5.1B confirmado: `ea619e9`. Não fazer push.

## 5.1C — Fix 02: comunicação de recusa (2026-11-26)

- Fix 01 validado localmente: 1.044 testes em 108 arquivos; duas tentativas de cartão recusadas, IDs remotos persistidos automaticamente na segunda, saldo de R$ 200,00 e nenhum recebimento no painel.
- Checkout exibe alerta acessível para `rejected`, sem expor detalhes do provedor; orientação de nova tentativa depende da elegibilidade já existente.
- Dois testes de interface adicionados; execução local e validação visual pendentes. Aprovação à vista ainda não homologada.
- Sem alterações em conciliação, autorização, migrations, dependências ou dados. Investigação do ciclo de vida do Brick permanece pendente.

## 5.1C — Fix 03: confirmação e acompanhamento automático (2026-11-26)

- Fix 01: 1.044 testes em 108 arquivos comprovados. Recusa de cartão corrigida e homologada. Fix 02: alerta visual de recusa aprovado pelo desenvolvedor; execução dos 1.046 testes previstos ainda não confirmada.
- Cartão à vista: cobrança de R$ 200,00 do pet Teste quitada na interface Customer, quatro tentativas recusadas e uma aprovada no PostgreSQL (processed/accredited), um único recebimento de R$ 200,00, origem mercado_pago, método credit_card, vinculado à aprovação. Preservar registros até a validação visual do Fix 03; não excluir automaticamente.
- Fix 03: confirmação reutilizável Pix/cartão, com valor da tentativa, método, parcelas quando cartão, pet e saldo autoritativo. A aprovação exige recebimento vinculado. Checkout individual recupera aprovação própria mesmo com saldo zero, sem liberar criação nem expor aprovação de outro tutor. Listagem financeira mantém regra anterior.
- Reutiliza o agendador existente, sem TanStack Query adicional ou WebSocket: consultas sequenciais 3/5/10/15 s, pausa em aba oculta, retoma no foco/visibilidade, encerra em estados terminais, cancela agendamento ao desmontar. Atualização manual apenas em falha; revalidação da rota na transição terminal (e criação) sem redirecionamento. Não há setState síncrono em effect. Cooldown remoto de 15 s e lock/escopo/autorização preservados.
- Pix anterior somente é mantido durante cooldown quando a resposta autorizada confirma tentativa e IDs compatíveis, estado pending e saldo/cobrança compatíveis. Falha de consulta ou estado terminal oculta o código; não libera tentativa. O saldo é calculado no servidor com o ledger; confirmação de saldo parcial não altera a política de bloqueio de novas tentativas aprovadas.
- Testes: +26 casos previstos em relação ao Fix 02 (1.072 testes/109 arquivos esperados se os 1.046 anteriores forem confirmados). Validação sintática TypeScript realizada; ESLint, typecheck, Prettier, Vitest e homologação local pendentes. Não houve alteração de dependências, migrations, package version (1.5.0) ou banco. Migration 0048 preservada. Sem commit/push/deploy.
- Próximo: confirmar suíte do Fix 03, validar aprovação existente sem criar Order, homologar transições Pix e cartão automaticamente, parcelamento, alteração concorrente do saldo e ciclo de vida do Brick. Expiração Pix efetiva em 5.1D.

## 5.1C — Fix 04: parcelamento e alerta de análise (2026-11-26)

- Fix 03: 1.072 testes/109 arquivos aprovados duas vezes, Prettier, ESLint, TypeScript, Drizzle e audit PROD aprovados; confirmação visual 11/11. Dois alertas DEV conhecidos.
- Cartão parcelado em homologação: Order e pagamento processed/accredited, principal R$ 200,00, total pago R$ 219,28, duas parcelas; tentativa local em review. Webhook HTTP 200 observado. Preservar tentativa até consulta autenticada e recuperação controlada; não criar nova Order.
- Conciliação exige principal exato, identidade, método, parcelas, status aprovado e ausência de estornos; somente cartão parcelado aceita total pago superior ao principal quando ambos os valores pagos coincidem e são válidos. Ledger registra apenas principal; duplicata usa a mesma validação. Revisão existente permanece bloqueada.
- Checkout apresenta alerta âmbar de análise, sem prometer atualização automática em review nem liberar nova tentativa. Polling e regras de segurança inalterados.
- Testes novos previstos: 19 (1.091/109 esperados); execução local pendente. Sem migrations, dependências, banco ou versão alterados. Manter túnel durante reinício isolado do Next.js; interromper acesso durante intervenção financeira e verificar preflight.

## 5.1C — Fix 05: confirmação exclusiva (2026-11-26)

- Fix 04: 1.091 testes/109 arquivos aprovados, alerta de análise 8/8; tentativa parcelada recuperada manualmente após GET autenticado (principal R$ 200,00, total pago R$ 219,28), um recebimento de R$ 200,00 e quatro recusas preservadas. Reteste automático ainda pendente.
- Confirmação aprovada passa a ocupar card único centralizado; resumo, cabeçalho do formulário e retorno duplicado são removidos apenas nesse estado. Mesma fonte autorizada do snapshot e mesmo polling, sem mudança de backend. Rótulo Valor pago da cobrança distingue principal de juros; quitação somente com saldo zero. Aviso de homologação preservado.
- Quatro testes adicionais previstos (1.095/109); execução local e homologação visual pendentes. Sem alteração de banco, migrations, dependências ou versão. Preservar recebimento atual para validação visual.

## 5.1C — Fix 05: revisão visual e planejamento de pagamentos parciais (2026-11-26)

- Layout centralizado do Fix 05 aplicado visualmente, mas reprovado pelo desenvolvedor por não combinar com a área de conteúdo. Revisão substitui o limite de 520px por card horizontal de largura disponível, cabeçalho compacto, indicadores em grid responsivo e detalhes em duas colunas; retorno único e aviso de teste preservados.
- Nenhuma alteração financeira: confirmação continua dependente do recebimento autorizado, com quitação apenas quando saldo zero. Um teste adicional previsto (1.096/109 esperados; última execução comprovada 1.091/109).
- Próximas entregas aprovadas em escopo: Fix 06 backend de pagamentos parciais (valor em centavos, saldo sob lock, expectedBalanceInCents, tentativa ativa única, validação de valor principal e idempotência); Fix 07 frontend (valor integral por padrão, escolha parcial e combinação sequencial Pix/cartão, confirmação parcial e retorno ao fluxo quando autorizado). Ainda não implementados. Não criar pagamentos simultâneos; preservar bloqueios de review.
- Reteste automático parcelado, concorrência, Pix com polling e checkpoint seguem pendentes. Sem alterações de banco, migrations, dependências ou versão. Não realizar commit/push.

## 5.1C — Fix 06A: backend de pagamentos parciais

- Base: Fix 05 revisão homologado, 1.096 testes em 109 arquivos. Novo contrato aceita amountInCents opcional para compatibilidade temporária; valor explícito exige expectedBalanceInCents, comparado sob lock do atendimento. Pix legado e cartão legado continuam integrais. Valor em centavos positivo e limitado ao saldo e ao tipo integer do banco.
- Aprovação somente deixa de bloquear novos recebimentos quando possui exatamente um recebimento compatível (identidade, principal, método, origem e chave de operação). Revisão, tentativa ativa e aprovação sem ledger continuam bloqueando. Recebimento manual segue a mesma regra; cancelamento de cobrança permanece conservador.
- Opções consideram bloqueios de todos os ambientes/coletores sem expor identificadores fora do escopo. QR parcial exige saldo suficiente, preservando autorização e cooldown. Conciliação existente credita principal e quita somente quando saldo zero.
- Sem migration ou dependência nova. Fix 06B (total efetivamente pago pelo comprador) e Fix 07 (seleção de valor, retomada da confirmação parcial, serviços, histórico e progresso) pendentes. Reteste funcional integral/parcelado/parcial e concorrência pendentes; manter criação desabilitada até homologação. Testes locais do Fix 06A pendentes. Não fazer commit/push.

## 5.1C — Fix 06B: total pago pelo comprador

- Fix 06A validado localmente: 1.117 testes em 109 arquivos; correção pontual removeu appointment.isPaid da validação de criação (saldo autoritativo sob lock).
- Migration 0049 aditiva: total remoto nullable na tentativa, constraint de principal e acréscimo somente para cartão parcelado. Não executar migration automaticamente nem preencher históricos por presunção.
- Conciliação autenticada grava total confirmado no mesmo fluxo transacional, mantendo principal no ledger. Aprovação histórica com ledger compatível pode receber o total em nova conciliação autenticada; divergência posterior entra em revisão sem sobrescrever total ou recebimento.
- Aplicação da migration exige autorização separada, validação de compatibilidade e backup do banco compartilhado. Não iniciar DEV com código novo antes de aplicar schema. Fix 07 ainda pendente, inclusive exposição autorizada do total e histórico ao tutor. Testes locais 06B e homologação financeira pendentes. Não fazer commit/push.

## 5.1C — Fix 07A: seleção do valor no checkout

- Fix 06B validado: 1.122 testes em 109 arquivos, migration 0049 aplicada com hash conferido, sem novo backup por decisão do responsável. Sincronização autenticada e repetida da tentativa histórica de teste confirmou principal 20000, total remoto 21928 e um único recebimento.
- Checkout reutiliza MoneyInputForm, React Hook Form e utilitários monetários; valor integral por padrão, parcial opcional. Pix e cartão enviam principal solicitado e saldo esperado distintos; Brick recebe o principal e valida o valor tokenizado. Backend mantém lock e reserva exclusiva.
- Alteração do valor remonta Brick; estabilidade no navegador e homologação real continuam pendentes. Continuidade direta após aprovação parcial, histórico autorizado e demonstrativo ficam no Fix 07B. Sem migration ou dependência nova. Não fazer commit/push.
