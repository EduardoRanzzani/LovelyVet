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

# LovelyVet — decisões técnicas e de negócio

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
- Decisão: reaproveitar a rotina de sincronização já autorizada e o agendador existente, sem adicionar cache de Pix no TanStack Query. A seleção checkout-only de tentativa aprovada mantém o componente após quitação; a ação de sync exige recibo e retorna dados mínimos. Saldo parcial é apenas apresentação, não mudança na reserva.

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
