## 1.6.0 — Fix 07J — progresso segmentado (27/11/2026)

- Barra reutilizável na confirmação e no comprovante: cartão emerald-700, Pix emerald-400, débito emerald-800, dinheiro emerald-600, outros emerald-300; saldo cinza neutro. Legenda compacta, acessível e responsiva, tema claro. Somente principal de recebimentos confirmados; agrega por método, sem acréscimos, parcelas ou identidade do pagador. Histórico incompleto/divergente mantém progresso total sem inventar composição. Sem alteração de autorização, conciliação, dependências, migration, versão ou banco.
- Fixes 07G–07I consolidados em `663ac5f`; 07F em `d212324`. Última suíte relatada: 1.184 testes/112 arquivos antes da última alteração textual. Privacidade 14/14, Brick 15/15 e persistência/arredondamento 13/13 homologados; divergência remota 87,71/87,72 reproduzida. Etapa 5.1C encerrada por decisão do desenvolvedor; concorrência manual dispensada, não executada nem aprovada.
- 5.1D: geração 9/9, recuperação navegador 12/12, reinício Next.js 14/14. Pix de teste aprovado automaticamente pelo cenário APRO; expiração real e liberação após expiração não homologadas manualmente. Revisar cobertura automatizada na 5.2. Implementação Pix preservada por decisão do desenvolvedor.
- 5.1E inventário confirmado: cartão principal 8.000 e Pix 6.000 centavos, dois recebimentos, saldo 6.000 de 20.000. Limpeza ainda não executada; preservar para homologar 07J, depois simulação ROLLBACK e limpeza autorizada. Oito testes novos preparados; validação local e aceite visual pendentes. Não fazer commit/push automático. Manter versão 1.5.0 até release; pagamentos novos DEV desabilitados durante validação. 5.2, 5.3 e release 6 seguem pendentes.

## 1.6.0 — fechamento da etapa 4.2 — 26/11/2026

Este checkpoint prevalece sobre os registros anteriores do ciclo Mercado Pago.

- Fix 01 aplicado; desenvolvedor confirmou Prettier, ESLint, TypeScript, Vitest (983 testes em 108 arquivos), Drizzle check e audit-prod aprovados. Duração da suíte final não informada; 11,02 s refere-se à execução anterior com uma falha.
- Audit-all: somente as duas moderadas DEV previamente aceitas, esbuild (GHSA-67mh-4wv8-2f99) e minimatch (GHSA-g3hv-75wg-m249). Não equivale a auditoria integral.
- Homologação visual confirmada pelo desenvolvedor: Admin 6/6 (extrato, origem manual, métodos, atendimento, valores/saldos, desktop/mobile); Doctor 3/3 (escopo, recebimentos, restrições); Customer 4/4 (Meu financeiro, cobrança de R$ 200,00 do pet Teste, ausência de controles staff, fluxo anterior preservado).
- Etapa 4.2 concluída quanto à implementação, regressão automatizada e aceite visual. Sincronização com provedor, tentativas reais, pagamentos tardios, concorrência real e conciliação ponta a ponta continuam pendentes na 5.1; mocks não comprovam esses cenários.
- Versão 1.5.0 mantida até fechamento da 1.6.0; migration 0048 preservada. Nenhuma alteração de código, dependências ou banco neste checkpoint. Commit proposto: `feat(payments): add staff online payment monitoring` (ainda não confirmado).
- Próximo passo: 5.1 — preparação segura da homologação integrada. Manter `MERCADO_PAGO_ENABLED=false` e gate de criação fechado até verificar saldo esperado no servidor, credenciais/ambiente/recebedor, rotação do segredo de webhook e compatibilidade com 1.5.0 no banco compartilhado. Somente pet Teste (`c943e3cd-d2bb-4c19-a386-5a8e56899128`); limpeza posterior autorizada e conferida, nunca automática. Preservar pendência de revisão de PDFs assinados. Não fazer push/deploy.

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

# LovelyVet — auditoria de segurança

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

## 1.6.0 — revisão preventiva do modelo Orders (25/11/2026)

A leitura estática do projeto de referência Vena Imports orienta os controles abaixo. Não constitui auditoria ou teste reproduzido de nenhum dos sistemas. Os controles MP-01 a MP-06 permanecem em aberto.

- MP-01: ambiente de pagamento, conta recebedora, Public Key, Access Token e segredo de webhook devem corresponder. Não usar prefixos de token como prova. Banco compartilhado por decisão expressa (ver checkpoint vigente); limitar baixas simuladas ao pet reservado, com validação de ambiente e recebedor, e limpar registros fictícios antes do release. Isolamento físico dispensado com risco aceito; controle operacional e validação de credenciais ainda pendentes.
- MP-02/03: validar vínculo financeiro e saldo sob lock comum; referência externa por UUID de tentativa, unicidade de IDs do provedor e ledger idempotente. Respostas concorrentes não podem regredir estados; reconciliar aprovações tardias e excedentes explicitamente. Timeout não implica falha definitiva, preservar chave idempotente e recuperar antes de permitir nova tentativa.
- MP-04: validar assinatura oficial, tópico e identificadores; consultar Order autenticada; conferir recebedor, referência, ambiente, moeda, valor e status com dados verificáveis do provedor. Não presumir que o body assinado confirma o pagamento. Persistir eventos/resultados idempotentes e limitar chamadas repetidas.
- MP-05/06: minimizar logs e dados pessoais; não persistir dados de cartão ou token de pagamento. Não atribuir recebimento automático a um Admin fictício. Detectar estornos/chargebacks e divergências para conciliação, sem estorno automático nem exclusão do ledger.

Nenhuma credencial foi utilizada, nenhuma chamada autenticada realizada, nenhum teste de integração executado. Manter os riscos residuais da 1.5.0 e auditar dependências do SDK quando adicionadas.

## 1.6.0 — riscos de arquitetura Mercado Pago (25/11/2026)

Inventário preventivo, não auditoria de implementação. A conta recebedora por ambiente foi definida; nenhuma credencial fornecida ou configurada. Banco atualmente compartilhado. Recomendação: banco de homologação separado e dados fictícios; bloquear baixa de teste no ledger real enquanto não houver isolamento comprovado. Não usar apenas nome/ID do pet, NODE_ENV, parâmetros do cliente ou prefixo do token como isolamento.

- MP-01 — credenciais e ambiente: tokens e segredo de webhook somente no servidor, configuração independente de modo/conta/URL e flag desativada por padrão; impedir cruzamento entre contas, ambientes e eventos.
- MP-02 — autorização e valores: validar sessão, vínculo financeiro e saldo atualizado no servidor; não confiar no valor, status ou ID de cobrança enviados pelo navegador.
- MP-03 — concorrência: reserva/tentativa única por cobrança, coordenação com recebimentos manuais e cancelamentos sob bloqueio transacional; reconciliar aprovações tardias, divergentes ou duplicadas sem baixa indevida.
- MP-04 — webhook: validar assinatura e consultar API autenticada; conferir identificador de tentativa, conta recebedora, modo, moeda, valor e estado; idempotência persistente e proteção contra replay. Não confiar em retorno do checkout.
- MP-05 — privacidade e rastreabilidade: mínimo de dados enviados e registrados; nunca persistir cartões, tokens ou segredos em logs. Representar origem automática sem atribuir a um usuário real; preservar autoria manual.
- MP-06 — estornos/chargebacks e falhas: detectar, sinalizar e reconciliar; não executar estorno automático ou apagar lançamentos. Definir política de conflitos e recuperação antes da ativação.

Todos os itens MP estão em planejamento, não corrigidos ou homologados. Os riscos residuais e evidências de 1.5.0 abaixo permanecem válidos.

## Estado vigente de segurança após publicação 1.5.0 — 25/11/2026

Publicação e homologação dos 12 itens do checklist confirmadas pelo desenvolvedor em produção, incluindo autenticação por perfil, histórico, receitas/assinatura/impressão e financeiro. Ausência de novos erros nos logs durante a homologação também confirmada; não equivale a pentest, auditoria integral, inspeção independente de logs ou prova de ausência de vulnerabilidades.

Última evidência local: 731 testes/85 arquivos, frozen-lock, Prettier, ESLint, TypeScript, Drizzle check e build aprovados; `pnpm audit --prod` sem vulnerabilidades conhecidas. `pnpm audit` completo permaneceu reprovado apenas por duas moderadas DEV aceitas expressamente: GHSA-67mh-4wv8-2f99 (esbuild via Drizzle Kit) e GHSA-g3hv-75wg-m249 (minimatch via TypeScript ESLint). Não suprimir, não forçar versões incompatíveis, não expor servidores de desenvolvimento ou aceitar entradas não confiáveis nas ferramentas. Reavaliar a cada ciclo e bloquear novos releases caso surjam outros alertas, alterações de gravidade/escopo ou falha de audit-prod. Sem nova auditoria neste pacote.

SEC-001 a SEC-005: manter proteções implementadas e testadas, inclusive autorização transacional, identidades Clerk e política de exclusão clínica. SEC-006 permanece como risco residual: acesso aos PDFs assinados por portador do link. Cabeçalhos de privacidade mitigam exposição acidental, não são autorização. A homologação funcional de receitas não constitui aceite específico dessa política; registrar decisão separada quando houver. Preservar QR/ITI e bytes assinados existentes. Revisões complementares de billing, uploads, logs, identidades, concorrência e privacidade histórica permanecem no backlog; não afirmar encerramento integral.

Limpeza fictícia confirmada no escopo do pet Teste; cadastro, foto e tutores preservados conforme escopo. Não repetir SQL ou migration 0047. Comprovante de backup e inventário posterior não fornecidos. Nenhuma alteração de código, banco ou configuração de auditoria neste fechamento. Hash de release e logs de deploy não apresentados.

As evidências abaixo são históricas; seus estados de bloqueio/pêndencia devem ser interpretados à luz deste checkpoint.

## Evidência de fechamento local — 25/11/2026

Validação final após a revisão de HTML, busca de pets e cadastro privilegiado: 731 testes/85 arquivos, Prettier, ESLint, TypeScript, frozen-lock, Drizzle check e build aprovados no Mac. Audit-prod sem vulnerabilidades conhecidas. Audit-all continua reprovado exclusivamente pelos dois advisories moderados DEV expressamente aceitos: GHSA-67mh-4wv8-2f99 (esbuild) e GHSA-g3hv-75wg-m249 (minimatch). Nenhuma ocorrência nova ou crítica/alta no relatório. Acompanhar versões compatíveis dos consumidores, não expor servidores dev, não processar entradas não confiáveis nas ferramentas e não ocultar alertas. Aceite restrito; alteração do perfil do risco ou novo alerta bloqueia publicação.

Limpeza do histórico fictício do pet Teste confirmada pelo desenvolvedor após inventário e análise de nove foreign keys. Escopo: 1 vacina, 1 vínculo de serviço e 1 atendimento; cadastro, foto, três tutores e demais dados fora do escopo. Backup e verificação pós-limpeza não comprovados neste ambiente. Não repetir a exclusão. Não houve migration neste fechamento.

SEC-006: mitigação por cabeçalhos de privacidade não equivale a autorização. PDF assinado por link permanece acessível a quem possui o endereço; confirmação específica de aceite da política e homologação ITI continuam necessárias antes do push. A suíte não prova ausência de vulnerabilidades; manter as demais pendências da revisão focal e registrar homologação real em produção. Commit/deploy ainda não comprovados.

## Revisão final e aceite DEV — 25/11/2026

O desenvolvedor aceitou expressamente, em 25/11/2026, manter temporariamente as duas ocorrências moderadas exclusivamente DEV: GHSA-67mh-4wv8-2f99 (esbuild via Drizzle Kit) e GHSA-g3hv-75wg-m249 (minimatch via TypeScript ESLint). Aguardar atualização compatível dos consumidores, sem forçar majors, sem ocultar advisories e sem expor servidores dev a terceiros. Aceite restrito a esses dois advisories, condicionado a audit-prod sem alertas e ausência de novos advisories ou mudança de gravidade/escopo. Audit-all continua com seu resultado real; qualquer alerta adicional bloqueia o release. Fixes transitivos existem segundo o log, mas a compatibilidade não foi demonstrada. Revisar no próximo ciclo de manutenção.

Achados estáticos adicionais (não se afirma exploração real):

- HTML legado: `pet-details.tsx`, `prescriptions-list.tsx` e `prescriptions-items-list.tsx` renderizavam conteúdo persistido diretamente. Gravações recentes sanitizam/escapam, mas conteúdo legado não pode ser presumido seguro. Sanitizar no ponto de renderização, com estrutura e declarações CSS fixas da receita; não modificar bytes assinados. `DOMParser` global do catálogo substituído por extração via DOMPurify isomórfico; corrigido aninhamento de texto rico em parágrafo no mobile.
- Privacidade: `getPetsPaginated` limitava pets e filtrava tutores na resposta, mas a busca por nome considerava todos os tutores. Restringir a subconsulta ao vínculo do Customer atual; manter busca de staff.
- Autorização: `upsertCustomer` permitia a Doctor atualizar name/email/image de usuário Admin/Doctor associado a cliente ou encontrado por e-mail. Exigir Admin nesse caso e incluir papel Customer no predicado UPDATE por Doctor (protege alteração concorrente de papel). Não alterar papel de usuário nem bloquear cadastros de clientes comuns ou acesso Admin.
- Billing: trava por atendimento, escopo, idempotência e saldo presentes; não houve ensaio concorrente real. Regra de compartilhamento financeiro preservada. Upload: autenticação, papel/pasta e assinatura de formato conferidos; chamadas externas não testadas aqui. PDF público por UUID/token mantém risco de compartilhamento; política definitiva pendente, cabeçalhos não são controle de acesso.
- Riscos a verificar: reconciliação de identidades em alterações cadastrais, logs detalhados de erros/assinatura (possível exposição de dados no log), janelas de corrida de vínculos e revisão de dados históricos; revisar política de anexos/notas do atendimento em pets compartilhados. Não há evidência de exploração. Não considerar auditoria integral concluída; testes estáticos e revisão focal não comprovam segurança em execução.

Validação do patch pendente; última suíte confirmada 718/83. Não alterar dependências, lockfile ou schema. Banco compartilhado: inventário somente leitura, sem exclusão automática.

## 4.1.7 — resultado pós-retirada do Shadcn CLI (25/11/2026)

Evidência real do Mac: instalação estrita, frozen-lock, format, lint, TypeScript e 718 testes/83 arquivos aprovados. Audit-prod sem vulnerabilidades conhecidas. Audit-all com duas moderadas; nenhuma crítica ou alta. Drizzle check e build Next 16.4.5 aprovados para diagnóstico. O gate audit-all permanece reprovado. A contagem não demonstra ausência de falhas da aplicação.

| Advisory            | Dependência e caminho dev                                                   | Versão corretiva indicada pelo log |
| ------------------- | --------------------------------------------------------------------------- | ---------------------------------- |
| GHSA-67mh-4wv8-2f99 | esbuild via drizzle-kit > @esbuild-kit/esm-loader > @esbuild-kit/core-utils | >=0.25.0                           |
| GHSA-g3hv-75wg-m249 | minimatch via eslint-config-next > typescript-eslint > typescript-estree    | >=11.0.1                           |

Risco residual: servidor de desenvolvimento do esbuild pode permitir leitura de respostas por sites externos; minimatch pode sofrer exaustão de recursos por padrões não confiáveis. Não expor ferramentas dev, não aceitar entradas/padrões não confiáveis e revisar atualizações compatíveis dos consumidores. Não substituir versões principais transitivas sem validar compatibilidade. Proposta de aceite temporário limitada a esses dois advisories, apenas se produção continuar limpa e nenhuma nova ocorrência surgir, sujeita à aprovação explícita do desenvolvedor. Não houve aceite, ignore, alteração de gate ou autorização de publicação. SEC-006, revisão financeira integral e demais riscos de aplicação continuam abertos.

## 4.1.7 — evidência pós-hotfix de peers (25/11/2026)

Log real: `pnpm install` estrito e frozen-lock aprovados; 718 testes em 83 arquivos, 19,11 s; `pnpm audit --prod`: nenhuma vulnerabilidade conhecida; audit completo: 4 ocorrências, 1 alta e 3 moderadas. Nenhuma crítica restante. Não equivale a auditoria integral de segurança do aplicativo.

| Advisory            | Dependência       | Caminho dev                                                     | Correção indicada no log |
| ------------------- | ----------------- | --------------------------------------------------------------- | ------------------------ |
| GHSA-mrhx-c7xc-m3w5 | zod               | shadcn, SDK e zod-to-json-schema                                | >=4.6.6                  |
| GHSA-67mh-4wv8-2f99 | esbuild           | drizzle-kit > @esbuild-kit/esm-loader > @esbuild-kit/core-utils | >=0.25.0                 |
| GHSA-rmxm-3fg6-px4f | @hono/node-server | shadcn > @modelcontextprotocol/sdk                              | >=2.1.3                  |
| GHSA-g3hv-75wg-m249 | minimatch         | shadcn e ESLint/typescript-eslint                               | >=11.0.1                 |

Proposta: remover Shadcn CLI da árvore local (não os componentes). A eliminação efetiva dos caminhos precisa ser confirmada por nova auditoria. Não impor major de Zod, Hono, minimatch ou esbuild legado aos consumidores sem validar compatibilidade. Nenhum advisory ignorado. Não aprovar automaticamente a skill dotenv. Auditoria completa continua gate de publicação; eventual falha permite apenas diagnóstico de Drizzle check/build, com saída final não zero. Riscos de desenvolvimento não são inexistentes; não expor servidores dev e não processar entradas não confiáveis nessas ferramentas. Aceite de risco residual não concedido.

## Saneamento interrompido na instalação (25/11/2026)

O primeiro pacote falhou no gate de instalação por conflitos de peers decorrentes dos overrides globais de node-forge e Zod. Remover ambos e fixar as versões diretas efetivamente resolvidas (node-forge 1.4.4, Zod 4.6.7), superiores aos mínimos do audit anterior. Não forçar Zod 3 para 4 sem comprovação de compatibilidade das ferramentas. Reexecutar audit de produção e completo; preservar alertas residuais e avaliar caminhos. Não há comprovação de que as 150 ocorrências foram resolvidas. Aviso sobre skill dotenv não autoriza instalação de instruções de agente. Sem supressão de advisories ou flexibilização de peers. Publicação bloqueada.

## Evidência de auditoria — 25/11/2026

`pnpm audit` reportou 150 ocorrências: 5 críticas, 43 altas, 81 moderadas e 21 baixas. Prettier, lint, typecheck e 718 testes/83 arquivos aprovados antes do audit. Críticas: três em Next.js (RCE), uma em Vitest (servidor UI) e uma em proxy-addr (cadeia de ferramentas shadcn). Auditoria não comprova exploração ou exposição de cada caminho em produção. Atualização proposta usa os mínimos corrigidos do relatório: Next 16.4.5, Vitest 4.1.12 (inclui correção do mocker esperada), proxy-addr 2.0.8, node-forge 1.4.3, Nodemailer 10.1.4, DOMPurify 3.4.17 e Zod 4.6.6. Overrides por faixa para demais transitivas selecionadas; `fast-uri` 3.1.9 substitui override anterior. Não forçar major de minimatch, esbuild legado, Zod 3 ou @hono/node-server 1 para resolver apenas o número do audit. Avaliar alertas residuais e compatibilidade. Sem exceções/ignore de GHSA; verificar audit de produção e completo após resolução real. Revalidar assinatura/ITI, SMTP, sanitização, editor e uploads. Não publicar enquanto houver falha do gate. SEC-006 e revisão financeira integral continuam abertas.

Atualização: 2026-11-25. Escopo: etapa 4.1 da versão 1.5.0. Não constitui auditoria integral concluída.

## Revisão focal para preparação da 1.5.0 — 25/11/2026

SEC-005: exclusões homologadas e V4 aceita no desktop; validação final após limpeza e hotfix, perfil Customer/mobile e commit permanecem pendentes de evidência. Não reclassificar como vulnerabilidade a política de exclusão compartilhada aprovada.

SEC-006 (aberta): `receitas/validar/[id]/pdf` entrega bytes assinados por UUID ou token; `_secretCode` é exigido apenas na resposta de metadados ITI, não no download direto. Página pública de validação também exibe dados nominais. O link atua como credencial de posse sem autenticação/expiração adicional; CORS não impede acesso direto. Não revogar links antigos sem política e teste do ITI. Foram adicionados cabeçalhos de não indexação e não envio de referrer nas rotas públicas; mitigação limitada, não impede acesso por terceiros com link, nem garante desindexação. Endpoint autenticado mantém `assertCanAccessPet` e escopo de tutor. Quatro testes novos previstos para cabeçalhos; verificar ITI real, acesso nominal e decisão de negócio antes de fechar SEC-006.

4.1.6: revisão focal de `billing.actions.ts`, `financial-access.ts`, `billing-queries.ts`, `customer-statement-queries.ts`, `pet-photo.actions.ts` e `upload-cloudinary.ts`. Cobranças/pagamentos exigem staff, travam atendimento, revalidam escopo, validam saldo/idempotência e bloqueiam cancelamento com pagamentos. Extrato do tutor filtra pelo vínculo atual; compartilhamento financeiro aprovado. Upload do tutor já confere MIME e assinatura, escopo e foto esperada no UPDATE. Upload da equipe conferia MIME declarado, tamanho e formato no Cloudinary; agora também rejeita vazio e confere assinatura antes de enviar. Seis testes novos previstos. Riscos residuais: leitura financeira em múltiplas consultas e vínculo na criação de cobrança sem trava compartilhada explícita; não houve teste concorrente no PostgreSQL, revisão de todos os fluxos ou chamada real de Cloudinary. Não declarar 4.1.6 concluída.

4.1.7: executar `pnpm audit` no Mac, incluindo dependências de desenvolvimento, sem correções automáticas. Não confundir auditoria histórica 1.2.0 com o resultado atual. Qualquer falha impede a indicação de gates verdes até análise. Banco compartilhado continua risco; nenhuma operação de limpeza automática.

## Inventário original

- SEC-001 — Vinculação automática de identidades Clerk por e-mail: corrigida na 4.1.2, validação automatizada aprovada conforme histórico.
- SEC-002 — Consulta de identidades sem filtro por ambiente: corrigida na 4.1.2, validação automatizada aprovada conforme histórico.
- SEC-003 — Exclusão de agendamento da consulta de disponibilidade sem validação suficiente de titularidade: corrigida na 4.1.3; aplicação, validação automatizada e homologação funcional aprovadas conforme relato do desenvolvedor; commit pendente.
- SEC-004 — Autorização de agendamentos não revalidada integralmente dentro da transação: corrigida na 4.1.3; aplicação, validação automatizada e homologação funcional aprovadas conforme relato do desenvolvedor; commit pendente.
- SEC-005 — Revisar permissões de exclusão de registros clínicos entre veterinários: revisão de política, não vulnerabilidade comprovada; política compartilhada aprovada; reforços validados e homologados na 4.1.4 (691 testes em 80 arquivos); commit pendente.
- SEC-006 — Revisar política de acesso público aos PDFs assinados: revisão de política, não vulnerabilidade comprovada; etapa 4.1.5.
- Revisão financeira e uploads: etapa 4.1.6.
- Auditoria de dependências: etapa 4.1.7.

## 4.1.2 — Segurança das identidades

Controles implementados: identidade por ID + ambiente, sem associação automática por e-mail ou substituição, e-mail primário verificado, validação Svix com corpo original, provisionamento transacional, preservação de Admin, exclusão de identidade por ambiente e alias Vitest para `server-only`. Validação automatizada aprovada conforme relato histórico; 613 testes previstos após a etapa.

## 4.1.2.1 — Gestão administrativa

Central `/admin` implementada; funcionamento confirmado pelo desenvolvedor, sem evidência detalhada de todos os testes manuais. 26 novos testes; execução completa confirmada no Mac: 639 testes, 79 arquivos, 25/11/2026.

Controles previstos: negar Doctor/Customer, ambiente diferente, Clerk ID inexistente, e-mail divergente/não verificado, conta banida/bloqueada, identidade já vinculada, substituição e duplicação concorrente. Confirmar revalidação transacional e rollback caso falhe a auditoria. Registro de auditoria de vinculações manuais bem-sucedidas, não de tentativas rejeitadas.

## 4.1.2.2 — Migration 0047 (concluída)

Banco `lovelyvet-application`, schema `public`. Antes da aplicação: enum `clerk_environment`, tabelas `users` e `clerk_identities` existentes; tabela de auditoria ausente. Cinco hashes (0042–0046) correspondentes conforme histórico; backup e Drizzle Kit check constam como concluídos no checkpoint anterior, sem logs disponíveis.

- `drizzle/0047_clerk_identity_link_audit.sql`.
- `public.clerk_identity_link_audit` criada.
- Colunas: id, admin_user_id, admin_clerk_user_id, target_user_id, environment, clerk_user_id, created_at.
- SHA-256: `89268b537bee11cec5364f6a01ae7ba03abe8d443c4dede9a7d3ee234beb939e`.
- Histórico `drizzle.__drizzle_migrations`: ID 15; `created_at`: 1795550000000; 0046 preservada (ID 14, timestamp 1795520000000).
- Contagem inicial: zero registros.

Consultas de validação históricas, não repetir automaticamente:

```sql
SELECT to_regclass('public.clerk_identity_link_audit') AS auditoria;

SELECT id, hash, created_at
FROM drizzle.__drizzle_migrations
ORDER BY created_at DESC
LIMIT 2;

SELECT COUNT(*) AS total_registros
FROM public.clerk_identity_link_audit;
```

Hash recalculado do ZIP atual e correspondente à evidência histórica. Nenhuma nova consulta foi feita ao PostgreSQL. A conferência não representa auditoria completa de constraints, índices ou schema. Não reaplicar 0047.

## 4.1.2.3 — Homologação e commit

- Funcionamento da tela Admin confirmado pelo desenvolvedor.
- Prettier, ESLint sem warnings, TypeScript e Vitest aprovados: 639/639 testes, 79/79 arquivos (16,31 s, 25/11/2026).
- Desenvolvedor informou que faltava apenas o commit. Comandos fornecidos; execução/hash ainda não comprovados; sem evidências individuais de todos os cenários manuais.

## 4.1.3 — Autorização dos agendamentos (homologada; commit pendente)

**SEC-003:** `getDoctorAvailability` aceita ID de exclusão somente após autorização; a condição de exclusão SQL também inclui o escopo. O agendamento alheio não deve desaparecer da disponibilidade.

**SEC-004:** `upsertAppointment`, `deleteAppointment`, confirmação, conclusão e cancelamento revalidam o acesso na transação após travar a linha. Customer mantém o vínculo com o pet original e destino protegido por `FOR SHARE`, com verificação de existência. Atualizações condicionadas ao escopo; mudança concorrente de status é rejeitada. Reagendamento dedicado já revalidava o veterinário após trava; a escrita agora também inclui o escopo. Não alterar serviços, valores ou histórico fora das regras existentes.

Evidências: revisão do código original, implementação e testes de regressão (22 casos adicionais previstos). Sintaxe TypeScript verificada; execução das validações no Mac aprovada conforme confirmação do desenvolvedor em 25/11/2026, sem log detalhado (661 testes e 80 arquivos previstos). Não houve teste contra PostgreSQL real nem simulação real de concorrência. Contexto de autenticação permanece o da requisição; revogação global durante a requisição não foi implementada. Os oito fluxos funcionais do checklist foram homologados pelo desenvolvedor em 25/11/2026. SEC-003 e SEC-004 podem ser consideradas corrigidas no escopo da etapa. Não há evidência individual de testes negativos manuais nem de concorrência real. Commit pendente.

## Riscos e restrições

PostgreSQL compartilhado entre Development e Production é limitação de isolamento; não alterar registros reais em testes. Não confundir separação de identidades Clerk com isolamento de dados. Não iniciar estornos ou desvinculação/substituição administrativa nesta versão. Não afirmar que testes ou auditorias passaram sem resultados. A etapa atual é 4.1.4; 4.1.5 será iniciada após seu fechamento.

## 4.1.4 — Segurança dos registros clínicos (SEC-005)

Decisão explícita do desenvolvedor em 25/11/2026: qualquer Admin ou Doctor pode excluir registros clínicos elegíveis, mesmo de outro profissional; Customer e solicitações não autenticadas não podem excluir. Não impor restrição por autor/doctorId. Receitas assinadas e vacinas ligadas a atendimento permanecem protegidas para ambos os papéis. Prontuários de atendimento, agendamentos, patologias e anexos continuam fora dos tipos excluíveis via timeline. Não ampliar a política de edição, leitura ou acesso a PDF.

Controles entregues: `requireStaff` efetivo no servidor; predicados por ID e pet, mais tipo para documentos; exclusões simples atômicas com `returning`; receita e vacina bloqueadas com `FOR UPDATE`. A assinatura usa a mesma trava da receita e a FK de assinatura tem `onDelete: restrict` no schema. Consulta de assinatura dentro da transação após obter a trava. Vacina com atendimento impede remoção de lembretes, e o DELETE repete `appointment_id IS NULL`; ausência de linha lança erro para abortar a transação. Lembretes de qualquer status do mesmo pet e vacina são excluídos na mesma transação. Botões e acionamento de exclusão alinhados com as restrições existentes.

Testes: autorização real `requireStaff` com contexto simulado, papéis e tipos, predicados SQL, ausência de linha, proteção de receita e vacina para Admin/Doctor, ordem das operações e comportamento de apresentação. Mocks não comprovam bloqueio ou rollback no PostgreSQL real. Não houve acesso a banco nem execução da suíte completa no ambiente do assistente. Não há nova migration, trilha de auditoria clínica, revogação instantânea de papel, ou revisão de todos os demais endpoints. A aprovação aceita o risco de exclusão cruzada entre profissionais. SEC-005 homologada conforme confirmação do desenvolvedor em 25/11/2026; fechamento pendente de validação do hotfix e commit. Vacinas criadas pelo modal já são vinculadas a atendimento; não inferir teste manual de vacina avulsa.

Observações: o histórico exibia HTML como texto. Hotfix usa a allowlist do sanitizador existente antes da renderização, apenas para observações. Três testes de regressão previstos; validar no Mac. A filtragem de dados no servidor permanece inalterada. Revisão dos demais pontos de renderização HTML permanece no escopo das etapas apropriadas.

Preview de layout: alteração de apresentação separada, preservando os filtros por papel, controle de exclusão, sanitização das observações e ações existentes. Cinco testes de apresentação previstos; sem nova validação real neste ambiente. Backup comentado da versão pós-hotfix não deve ser substituído por código anterior à SEC-005.

## Preview v2 — 25/11/2026

Preview v2 sem mudança de autorização no servidor. `getPetById` continua usando `buildPetAccessCondition` e `filterPetForViewer`; este remove observações internas, vínculos alheios, PII e documentos nominais de outros tutores. O cliente não monta abas de staff para Customer, nem inclui observações em seus eventos; exclusão permanece bloqueada. Testes reais e homologação por perfil pendentes. Não encerrar SEC-006 neste preview.

## Preview v3 — 25/11/2026

Somente apresentação e testes de `TabHistory` alterados; `pet-details.tsx`, Linha do Tempo, sanitização, Server Actions, filtros de privacidade e regras de exclusão permanecem iguais à v2. Testes de papéis da v2 preservados; execução real e homologação do preview ainda pendentes. Não encerra SEC-006 nem substitui revisão do servidor.

## Preview v4 — 25/11/2026

Alteração exclusivamente visual na largura da grade expandida de ações e ajuste de teste estrutural existente. Nenhuma mudança em Server Actions, permissões, filtragem de dados, sanitização, painel de Linha do Tempo ou proteção de registros. Validação real e aceite visual pendentes.

## Aceite visual e limpeza — 25/11/2026

V4 aprovada visualmente pelo desenvolvedor no desktop. Removido o código comentado de reversão e as alternativas legadas dos componentes de apresentação; preservadas a sanitização de observações, exclusão condicionada e regras Admin/Doctor/Customer. Não modifica Server Actions, consultas, schema ou filtros de privacidade. Testes de regressão por perfil e exclusão mantidos; dois testes de modo legado substituídos por verificações do painel definitivo. Execução final da suíte e homologação específica mobile/Customer ainda não comprovadas; fechamento no Git pendente. SEC-006 permanece pendente.

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
- Sem ampliação do acesso: vínculo atual, iniciador, ambiente, Collector ID e escopo do pet continuam obrigatórios. Recibo verificado por vínculo único da tentativa; nenhum ID remoto, segredo ou payload bruto é acrescentado ao snapshot. Atualização automática não cria Order. Validar carga e concorrência local; alertas DEV esbuild/minimatch permanecem conhecidos, última audit-prod limpa no Fix 01.

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

## 5.1C — Fix 07B: demonstrativo financeiro

- Fix 07A validado com 1.127 testes em 109 arquivos; checkpoint local informado pelo responsável, sem push.
- Confirmação horizontal apresenta itens históricos do atendimento, principal, saldo, progresso, recebimentos da cobrança e total remoto da operação. Dados complementares de outros tutores não são expostos; totais próprios online ficam indisponíveis se houver valores desconhecidos. Parcelamento exibe quantidade, sem presumir valor individual das parcelas.
- Continuidade explícita após aprovação parcial depende de opção autorizada atualizada e saldo igual ao snapshot; backend mantém reserva exclusiva e lock. Reabertura de cobrança quitada recupera aprovação própria mais recente, sem sobrepor bloqueios.
- Sem migration, dependência ou alteração de dados. Testes locais e homologação real pendentes (Pix, cartão, combinação, concorrência, Brick). Não fazer push antes da homologação.

## 5.1C — Fix 07C: edição do valor monetário

- Fix 07B: validações automatizadas e homologação visual (17/17) informadas pelo responsável.
- Checkout parcial inicia vazio; MoneyInputForm preserva texto decimal durante a edição somente quando explicitamente solicitado. Outros formulários mantêm o contrato numérico e a escala fixa padrão.
- Conversão para centavos e limites de saldo continuam no checkout e no servidor; campo vazio não permite iniciar pagamento.
- Teste de edição incremental e exclusão adicionado; execução local e validação do cursor no navegador pendentes. Sem migration, dependência ou alteração no banco.

## 5.1C — Fix 07D: divergência de centavo no cartão parcelado

- Base confirmada pelo responsável: 1.131 testes em 109 arquivos; Fix 07C 13/13, demonstrativo 17/17, Pix + cartão parcelado homologado com principal 20000, desembolso 20964 e dois recebimentos. Ordem inversa encontrou cartão parcial de 8000 aprovado remotamente, com totais 8771 na Order e 8772 na transação; conta de homologação confirmada. Causa do arredondamento no provedor ainda não documentada.
- A conciliação aceita diferença máxima de um centavo entre dois totais válidos de cartão parcelado, ambos iguais ou superiores ao principal. O principal continua exato em todos os métodos. Se os totais divergem, credita somente o principal e grava total complementar NULL; não presume valor desembolsado. Nova consulta com totais iguais pode complementar; valor já confirmado não é sobrescrito e divergência posterior permanece em revisão.
- Revisão `remote_paid_amount_mismatch` de cartão parcelado admite reconsulta explícita pela equipe autorizada, com cooldown e IDs persistidos, total complementar nulo, ausência de recebimento/chave correspondente e revalidação integral sob lock. Só um plano de crédito pode resolver a revisão; outros motivos, webhook e polling não reabrem revisões. Estornos, identidade, ambiente, escopo, saldo e idempotência permanecem protegidos.
- Sem nova migration, dependência ou alteração automática de banco na instalação. Testes locais e recuperação da tentativa de 8000 pendentes; manter criação desabilitada até validar. Depois homologar Pix de 12000, concorrência, ciclo de vida do Brick e checkpoint documental/Git. Sem push antes da release.

## 5.1C — Fix 07E: apresentação da confirmação

- Fix 07D: 1.152 testes em 109 arquivos aprovados localmente; recuperação administrativa do cartão de 8000 e idempotência confirmadas. Cartão + Pix de 12000 homologado, dois recebimentos, saldo zero, total complementar do cartão NULL. Aprovação automática com divergência de centavo ainda pendente.
- Confirmação com destaque verde horizontal, resumo financeiro compacto, detalhes e itens em cards responsivos e ícones no histórico. Preserva valores desconhecidos, autorização de continuidade, escopo e regras de conciliação.
- Dois testes de apresentação adicionados; validação local e visual pendentes. Sem migration, dependência, alteração de banco ou push. Preservar os recebimentos atuais para homologação visual.

## 5.1C — Fix 07F: Total pago e tema claro

- Fix 07E: homologação visual 12/12 itens aplicáveis informada; tema escuro não faz parte do produto. LovelyVet utiliza exclusivamente tema claro; não adicionar variantes `dark:` nem seletor de tema. Remoção das variantes introduzidas na confirmação; auditoria global de tema não incluída.
- Decisão explícita do responsável: priorizar `transactions.payments[0].paid_amount` na diferença de até um centavo entre totais válidos de cartão parcelado. Não há confirmação formal do provedor de precedência em caso de divergência. Principal, identidade, método, parcelas, estornos e limites permanecem exatos; valor confirmado divergente não é sobrescrito.
- Reconsulta autenticada pode complementar tentativa aprovada com total NULL sem novo recebimento, inclusive cobrança quitada. Histórico mantém principal explícito e mostra desembolso/acréscimos somente dos pagamentos próprios. Total desconhecido permanece indisponível.
- Evidências: Cartão + Pix 20/20 verificações funcionais e persistência confirmada, principal 20000, dois recebimentos, saldo zero. Caso 8000: Order 8771, transação 8772; esperado total acumulado 20772 após sincronização, sem alterar o ledger.
- Qualidade da integração: gravação do painel VenaImports em teste (medição 10/10/2026, 50/100) é referência, não pontuação atual LovelyVet. Avaliar separadamente `items.quantity`, `items.unit_price`, `statement_descriptor`, nome e data de cadastro do pagador, minimização de dados, recuperação, logs e relatórios; não enviar itens integrais como se quitados parcialmente. Medir a aplicação correta antes da release.
- Sem migration, dependência, alteração automática de banco ou push. Testes locais, sincronização, idempotência, nova aprovação automática com divergência, concorrência e ciclo do Brick pendentes.

## 5.1C — Fix 07G: clareza do parcelamento

- Fix 07F: 1.157 testes aprovados conforme relato do responsável; complementação administrativa e idempotência confirmadas (principal 8000, desembolso 8772, recebimento único). Cartão + Pix quitado com desembolso 20772. Limpeza intermediária confirmada; novo cartão parcial aprovado automaticamente, homologação funcional 16/16. Consulta remota da nova ordem ainda pendente.
- Detalhes e histórico exibem quantidade e valor médio da parcela usando exclusivamente o total pago confirmado, em centavos. Quando a divisão não é exata, indica aproximadamente; não representa cronograma de parcelas fornecido pelo emissor. Total desconhecido mantém somente a quantidade. Histórico não deriva valores complementares de pagamentos de outros tutores.
- Sem alteração de conciliação, autorização, schema, dependências ou dados; tema claro preservado. Testes locais e homologação visual pendentes. Preservar pagamento atual e saldo de 12000 para concorrência entre tutores, saldo desatualizado e ciclo do Brick. Sem push antes da release.

## 5.1C — Fix 07H: comprovante online histórico

- Meu financeiro: link Ver comprovante por recebimento online próprio, com rota `/my-finance/[chargeId]/payment/[attemptId]`, filtros preservados e layout de confirmação reutilizado. A consulta é somente leitura, não chama o provedor nem depende da flag de criação; exige configuração de escopo válida, vínculo atual, iniciador, ambiente, coletor, aprovação e identidade do recebimento. Sem link para pagamento manual ou de cotutor; acesso direto inválido retorna not found.
- O resumo reflete o saldo atual da cobrança e identifica a operação consultada; retorno ao Meu financeiro para iniciar novos pagamentos pelos gates existentes. Não é comprovante fiscal nem extrato imutável do provedor. Tema claro.
- Sem migration, dependências, alterações financeiras ou push. Testes locais, homologação do Fix 07G/07H, consulta remota da aprovação automática e concorrência entre tutores continuam pendentes.

## 5.1C — Fix 07I: refinamento visual do comprovante

- Fixes 07G/07H: imagens confirmam parcelamento 2x de R$ 43,86, comprovante histórico parcial, botão no histórico e checkout separado. Testes locais e isolamento entre tutores ainda aguardam confirmação.
- Cabeçalho branco compacto, ícone de sucesso verde, indicadores menores de desembolso e saldo, principal separado e progresso integrado. Data histórica incorporada ao cabeçalho; aviso de saldo atual preservado. Total remoto desconhecido não é substituído pelo principal. Tema exclusivamente claro.
- Dois novos testes de apresentação e reforço do teste da rota histórica. Sem alteração de autorização, conciliação, consultas financeiras, dependências, migrations ou banco. Validação local e visual pendentes; preservar pagamento de teste e saldo de 12000. Sem commit ou push automático.
