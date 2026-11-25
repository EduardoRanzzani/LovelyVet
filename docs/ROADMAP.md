# LovelyVet — roadmap oficial

## Checkpoint vigente — 1.6.0 / etapas 1.1–2.1 validadas (25/11/2026)

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

## Histórico — checkpoint — 1.6.0 / revisão da arquitetura (25/11/2026)

Direção técnica definida a partir do Vena Imports: Checkout Transparente com Orders, SDKs oficiais, Pix e crédito. Etapa 1.1.1 registrada; etapa 1.1.2 em andamento, isolamento ainda não comprovado. Não alterar banco de produção ou versão do código. O próximo passo é provisionar e verificar homologação isolada e então modelar 1.2.1–1.2.3. A 1.5.0 permanece publicada.

## Histórico — checkpoint — planejamento da 1.6.0 (25/11/2026)

A 1.5.0 segue publicada e homologada. Início da 1.6.0: etapa 1.1 em andamento; conta recebedora única por ambiente confirmada (conta do desenvolvedor em teste; conta da esposa em produção). Isolamento do banco de homologação e demais regras de negócio ainda a decidir. Não alterar versão ou aplicar migration nesta etapa. A seção 1.6.0 abaixo é o roteiro vigente; registros de 1.5.0 são históricos.

## Histórico — checkpoint — 1.5.0 publicada e homologada (25/11/2026)

Release encerrado quanto à publicação e aos 12 itens de homologação em produção, por confirmação do desenvolvedor. A versão vigente é 1.5.0. Última suíte local: 731 testes/85 arquivos; audit-prod sem ocorrências conhecidas; build e Drizzle check aprovados. 4.1.7 encerra com aceite temporário de dois riscos DEV, não com audit-all limpo. As revisões 4.1.5, 4.1.6, 4.2 e 4.3 foram focais; a abrangência integral não está comprovada e permanece como manutenção complementar, sem reabrir o release publicado. O próximo ciclo de desenvolvimento é 1.6.0 (Mercado Pago). Antes de iniciar, versionar esta documentação; não alterar o número da versão até a etapa de release correspondente.

### Backlog de manutenção transversal

- Acompanhar atualizações compatíveis de Drizzle Kit/esbuild e TypeScript ESLint/minimatch; preservar os alertas de auditoria e revisar a cada ciclo.
- SEC-006: revisar política de compartilhamento dos PDFs assinados por link e documentar decisão específica; preservar interoperabilidade ITI e bytes assinados até decisão aprovada.
- Completar revisões de autorização, privacidade, financeiro, uploads, qualidade, pluralização e interface onde a revisão focal não foi exaustiva; verificar cenários mobile e e-mail se ainda não documentados.
- Complementar as evidências de Git/deploy e backup/inventário posterior da limpeza quando disponíveis, sem repetir a exclusão.

Este checkpoint e a lista canônica da versão abaixo prevalecem sobre os registros históricos de preparação.

## Histórico — Fechamento local vigente — 1.5.0 (25/11/2026)

4.1.4: exclusões clínicas e layout desktop aprovados, patch final validado. 4.1.5/4.1.6: revisão focal de PDFs, financeiro e uploads entregue e testada; política pública de PDF e homologações restantes a confirmar. 4.1.7: audit-prod limpo, duas moderadas DEV aceitas temporariamente; acompanhar correções compatíveis. 4.2/4.3: melhorias e revisão estática focal entregues, sem afirmar auditoria integral. 4.4: regressão automatizada aprovada, 731 testes/85 arquivos; confirmar regressão manual restante. 4.5: limpeza do histórico fictício do pet Teste confirmada pelo desenvolvedor; cadastro, foto e tutores preservados no escopo aprovado, evidência pós-limpeza/backup não apresentada. 5.1/5.2: versão 1.5.0 e changelog locais. 5.3: build aprovado. 5.4: commit e publicação solicitados, ainda não executados; 5.5: homologação em produção pendente. Próxima etapa após fechamento: 1.6.0 (Mercado Pago). Este checkpoint prevalece sobre os históricos abaixo.

## Histórico — Fechamento vigente da 1.5.0 — 25/11/2026

4.1.7: aceite temporário expresso das duas ocorrências moderadas exclusivamente DEV (esbuild e minimatch); manter audit-prod sem ocorrências conhecidas, relatório completo visível e bloquear novos riscos. 4.1.4/4.2: layout V4 desktop aceito e limpo; revisão estática adicional entregue. 4.1.5/4.1.6/4.3: revisão focal e correções de HTML, busca e cadastro privilegiado entregues; validação do patch, política de PDF e homologações ainda pendentes. 4.4: último log real 718/83, reexecutar após correções (731/85 esperados). 4.5: limpeza não adiada, inventário somente leitura primeiro, IDs e backup antes de excluir; nenhum registro removido. 5.1/5.2: versão e changelog locais; 5.3: build anterior aprovado, revalidar; 5.4/5.5: commit, publicação e homologação em produção pendentes. Próximo ciclo: acompanhar atualizações compatíveis de Drizzle Kit/esbuild e TypeScript ESLint/minimatch; manter 1.6.0 (Mercado Pago) após release.

## Checkpoint de candidato 1.5.0 — 25/11/2026

4.1.4: exclusões e layout desktop aceitos; testes finais comprovados (718/83), commit e homologações restantes pendentes. 4.1.5/4.1.6: reforços focais entregues, revisão integral e política SEC-006 ainda abertas. 4.1.7: produção sem vulnerabilidades conhecidas, auditoria completa reprovada por dois avisos moderados dev; retirada do CLI Shadcn confirmada. Proposta de aceite temporário e restrito ainda não aprovada. 4.2/4.3: melhorias pontuais entregues, revisão geral não comprovada. 4.4: validação automatizada aprovada, regressão manual pendente; 4.5: identificação de dados fictícios/decisão pendente. 5.1/5.2: versão e changelog locais; 5.3: build local Next 16.4.5 aprovado; 5.4/5.5: publicação e homologação em produção pendentes. Não marcar etapas abertas como concluídas nem transferir pendências sem aprovação. Este checkpoint prevalece sobre os históricos.

## Checkpoint 4.1.7 — auditoria residual dev (25/11/2026)

Peers resolvidos; 718 testes/83 arquivos aprovados após atualização, audit-prod sem vulnerabilidades conhecidas, audit-all com quatro ocorrências exclusivamente na árvore dev (uma alta, três moderadas). Saneamento adicional propõe retirar CLI Shadcn não utilizado por scripts/runtime, preservando a UI. Validação pendente. 4.1.7 segue aberta; 5.3 ainda não executada no log, 5.4/5.5 pendentes. Build poderá rodar como diagnóstico apesar de falha exclusiva de audit-all, sem liberar deploy. Não antecipar 1.6.0. Demais pendências do checkpoint anterior permanecem.

## Histórico — Bloqueio atual 4.1.7 — peer dependencies (25/11/2026)

Saneamento inicial instalado parcialmente; resolução de peers falhou. Hotfix de manifestos preparado, ainda não validado. Etapa 4.1.7 continua aberta, 5.3 a 5.5 pendentes. Última suíte confirmada 718/83 antes da troca de versões. Este checkpoint prevalece sobre os históricos abaixo; não antecipar a 1.6.0.

## Resultado da preparação e bloqueio de release — 25/11/2026

A preparação local 1.5.0 passou em Prettier, ESLint, TypeScript e 718 testes (83 arquivos). 4.1.7 está bloqueada por 150 ocorrências de auditoria, 5 críticas; atualização de dependências entregue para validação, não homologada. 5.1/5.2 aplicadas localmente; 5.3 ainda não executada, 5.4/5.5 pendentes. Revisão manual, política SEC-006, limpeza identificada de dados fictícios e commits ainda pendentes de confirmação. Este checkpoint prevalece sobre a previsão histórica abaixo.

Atualização: 2026-11-25. Fonte: documento de continuidade recuperado da conversa anterior e confirmação atual do desenvolvedor.

## Preparação consolidada — 25/11/2026

Entrega única de preparação da 1.5.0 solicitada pelo desenvolvedor. 4.1.4: aceite desktop e exclusões confirmado; validação final e commit pendentes. 4.1.5: revisão focal da política pública e reforço de cabeçalhos; aceite da política e homologação pendentes. 4.1.6: revisão focal financeira e reforço de upload; revisão integral pendente. 4.1.7: auditoria no instalador. 4.2/4.3: melhorias pontuais implementadas, revisão completa não comprovada. 4.4/4.5: regressão e identificação segura dos dados fictícios ainda necessárias. 5.1/5.2: versão local e changelog preparados; build, publicação e homologação em produção não comprovados. A sequência original abaixo permanece válida; não transferir pendências para 1.6.0 sem aprovação explícita.

## Versão 1.5.0 — publicada

Versão vigente do código: 1.5.0. Publicação e homologação em produção confirmadas em 25/11/2026.

- [x] Etapas 1 e 2 — Agendamentos e cuidados clínicos.
- [x] Etapa 3 — Financeiro, dashboards e gerenciamento de fotos.
- [x] 4.0 — Padronização com Prettier.
- [x] 4.1.1 — Inventário de segurança.
- [x] 4.1.2 — Segurança das identidades Clerk.
- [x] 4.1.2.1 — Gestão administrativa de identidades; 639 testes aprovados na etapa.
- [x] 4.1.2.2 — Migration 0047 aplicada e validada.
- [x] 4.1.2.3 — Homologação e commit Clerk (5e5bf2d confirmado no log anterior).
- [x] 4.1.3 — Autorização dos agendamentos (SEC-003/004), homologada e commit a242e84 confirmado.
- [x] 4.1.4 — Segurança dos registros clínicos (SEC-005); exclusões homologadas e validação final aprovada.
- [x] 4.1.5 — Revisão focal de receitas e PDFs entregue; política SEC-006 residual no backlog.
- [x] 4.1.6 — Revisão focal financeira e reforço de uploads; revisão integral complementar no backlog.
- [x] 4.1.7 — Auditoria de dependências; audit-prod limpo, dois avisos DEV aceitos e audit-all não aprovado.
- [x] 4.2 — Layout definitivo V4 e melhorias pontuais de interface/pluralização; revisão integral complementar no backlog.
- [x] 4.3 — Revisão estática focal e correções relevantes para release; não equivale a revisão exaustiva.
- [x] 4.4 — Regressão automatizada (731/85) e checklist de produção aprovado; cenários adicionais não documentados permanecem como manutenção.
- [x] 4.5 — Limpeza do histórico fictício do pet Teste confirmada, sem excluir cadastro.
- [x] 5.1 — Versão 1.5.0.
- [x] 5.2 — Changelog.
- [x] 5.3 — Build de produção aprovado.
- [x] 5.4 — Publicação confirmada pelo desenvolvedor; hash/URL não fornecidos.
- [x] 5.5 — Homologação em produção (12/12 itens confirmados pelo desenvolvedor).

As marcações 4.1.5, 4.1.6, 4.2 e 4.3 encerram o escopo focal entregue no release, não as revisões complementares listadas no backlog. Não implementar estornos ou desvinculação/substituição administrativa de identidades sem aprovação de escopo.

## Versão 1.6.0 — Mercado Pago

Ciclo iniciado. Status: etapas 1.1, 1.2 e 2.1 concluídas; próximo bloco 2.2/2.3. Escopo inicial aprovado:

- Pagamento online pelo portal do tutor (`/my-finance`).
- Integração segura com Mercado Pago e webhooks.
- Idempotência e conciliação financeira.
- Atualização automática das cobranças.
- Prevenção de pagamentos duplicados, inclusive entre tutores do mesmo pet.
- Preservação dos pagamentos manuais existentes.

- [x] 1.1 — Arquitetura e regras de negócio.
    - [x] 1.1.1 — Revisão arquitetural com referência Vena Imports (decisão registrada, sem implementação).
    - [x] 1.1.2 — Decisão de infraestrutura: banco compartilhado mantido; risco aceito; isolamento físico dispensado.
- [x] 1.2 — Modelagem e migration 0048.
    - [x] 1.2.1 — Modelagem de tentativas de pagamento online.
    - [x] 1.2.2 — Adaptação do ledger financeiro.
    - [x] 1.2.3 — Migration 0048 aplicada e testes de metadados aprovados; testes reais de constraints ficam para homologação.
- [x] 2.1 — Cliente da API Mercado Pago (SDK 3.6.1 instalado, 788 testes aprovados, audit-prod limpo).
- [ ] 2.2 — Criação de tentativas Orders (Pix e cartão).
- [ ] 2.3 — Controle de concorrência e idempotência.
- [ ] 3.1 — Webhook e validação de assinatura.
- [ ] 3.2 — Conciliação financeira automática.
- [ ] 3.3 — Integração com pagamentos manuais.
- [ ] 4.1 — Interface financeira do tutor.
- [ ] 4.2 — Acompanhamento pela equipe.
- [ ] 5.1 — Homologação com credenciais de teste e dados restritos ao pet Teste; limpeza posterior no banco compartilhado.
- [ ] 5.2 — Auditoria de segurança e regressão.
- [ ] 6.1 — Documentação, changelog e versionamento.
- [ ] 6.2 — Publicação e homologação em produção.

Não solicitar nem armazenar credenciais do Mercado Pago no código. Preservar pagamentos manuais e manter a integração desligada por padrão. Não marcar etapas implementadas ou homologadas antes de evidências.

## Preview v2 — 25/11/2026

Ajuste do preview antecipado 4.2: restaurar cabeçalho original, equalizar botões e unificar painéis Histórico/Linha do Tempo. Demais abas ainda provisórias. Homologação pendente, incluindo perfil Customer. Não muda a sequência de segurança/release.

## Preview v3 — 25/11/2026

Ajuste de apresentação aprovado: cabeçalho original; ações clínicas coloridas compactas à esquerda e histórico à direita, com divisão igual em telas grandes (2xl), empilhando em telas menores. Mantém painel de Linha do Tempo e regras do Customer da v2. Preview antecipado da 4.2 ainda em homologação; não altera a sequência do release.

## Preview v4 — 25/11/2026

Ajuste pontual solicitado na homologação da v3: preencher toda a largura da coluna de ações, sem aumentar a altura dos botões nem mudar a divisão 50/50. Preview continua em homologação; próxima etapa de segurança permanece 4.1.5.

## Aceite da v4 e limpeza final — 25/11/2026

Layout aprovado pelo desenvolvedor no desktop; remover backup comentado e modo legado. Aguardar validação automatizada final e confirmação dos demais cenários antes do commit. A etapa 4.2 não está concluída; próxima etapa de segurança continua 4.1.5.
