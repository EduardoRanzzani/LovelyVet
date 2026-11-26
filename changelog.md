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

## Histórico de alterações

### [Não publicado] — 1.6.0 / checkpoint 4.1 (25/11/2026)

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

## Checkpoint 4.2 — 2026-11-26 (fix 01)

- Validação local informada: Prettier, ESLint e TypeScript aprovados; Vitest: 982/983 testes, 107/108 arquivos, 11,02 s.
- Fix no teste `src/server/payments/staff-payment-sync.service.test.ts`: verificar o retorno do serviço, não o retorno indefinido do mock de conciliação. Mantidas as verificações de transação e privacidade.
- Reexecução da suíte, Drizzle check, auditoria e homologação visual pendentes; etapa 4.2 ainda não encerrada. Sem alterações de runtime, migration, versão ou banco.
