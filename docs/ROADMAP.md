# LovelyVet — roadmap oficial

## Fechamento local vigente — 1.5.0 (25/11/2026)

4.1.4: exclusões clínicas e layout desktop aprovados, patch final validado. 4.1.5/4.1.6: revisão focal de PDFs, financeiro e uploads entregue e testada; política pública de PDF e homologações restantes a confirmar. 4.1.7: audit-prod limpo, duas moderadas DEV aceitas temporariamente; acompanhar correções compatíveis. 4.2/4.3: melhorias e revisão estática focal entregues, sem afirmar auditoria integral. 4.4: regressão automatizada aprovada, 731 testes/85 arquivos; confirmar regressão manual restante. 4.5: limpeza do histórico fictício do pet Teste confirmada pelo desenvolvedor; cadastro, foto e tutores preservados no escopo aprovado, evidência pós-limpeza/backup não apresentada. 5.1/5.2: versão 1.5.0 e changelog locais. 5.3: build aprovado. 5.4: commit e publicação solicitados, ainda não executados; 5.5: homologação em produção pendente. Próxima etapa após fechamento: 1.6.0 (Mercado Pago). Este checkpoint prevalece sobre os históricos abaixo.

## Fechamento vigente da 1.5.0 — 25/11/2026

4.1.7: aceite temporário expresso das duas ocorrências moderadas exclusivamente DEV (esbuild e minimatch); manter audit-prod sem ocorrências conhecidas, relatório completo visível e bloquear novos riscos. 4.1.4/4.2: layout V4 desktop aceito e limpo; revisão estática adicional entregue. 4.1.5/4.1.6/4.3: revisão focal e correções de HTML, busca e cadastro privilegiado entregues; validação do patch, política de PDF e homologações ainda pendentes. 4.4: último log real 718/83, reexecutar após correções (731/85 esperados). 4.5: limpeza não adiada, inventário somente leitura primeiro, IDs e backup antes de excluir; nenhum registro removido. 5.1/5.2: versão e changelog locais; 5.3: build anterior aprovado, revalidar; 5.4/5.5: commit, publicação e homologação em produção pendentes. Próximo ciclo: acompanhar atualizações compatíveis de Drizzle Kit/esbuild e TypeScript ESLint/minimatch; manter 1.6.0 (Mercado Pago) após release.

## Checkpoint de candidato 1.5.0 — 25/11/2026

4.1.4: exclusões e layout desktop aceitos; testes finais comprovados (718/83), commit e homologações restantes pendentes. 4.1.5/4.1.6: reforços focais entregues, revisão integral e política SEC-006 ainda abertas. 4.1.7: produção sem vulnerabilidades conhecidas, auditoria completa reprovada por dois avisos moderados dev; retirada do CLI Shadcn confirmada. Proposta de aceite temporário e restrito ainda não aprovada. 4.2/4.3: melhorias pontuais entregues, revisão geral não comprovada. 4.4: validação automatizada aprovada, regressão manual pendente; 4.5: identificação de dados fictícios/decisão pendente. 5.1/5.2: versão e changelog locais; 5.3: build local Next 16.4.5 aprovado; 5.4/5.5: publicação e homologação em produção pendentes. Não marcar etapas abertas como concluídas nem transferir pendências sem aprovação. Este checkpoint prevalece sobre os históricos.

## Checkpoint 4.1.7 — auditoria residual dev (25/11/2026)

Peers resolvidos; 718 testes/83 arquivos aprovados após atualização, audit-prod sem vulnerabilidades conhecidas, audit-all com quatro ocorrências exclusivamente na árvore dev (uma alta, três moderadas). Saneamento adicional propõe retirar CLI Shadcn não utilizado por scripts/runtime, preservando a UI. Validação pendente. 4.1.7 segue aberta; 5.3 ainda não executada no log, 5.4/5.5 pendentes. Build poderá rodar como diagnóstico apesar de falha exclusiva de audit-all, sem liberar deploy. Não antecipar 1.6.0. Demais pendências do checkpoint anterior permanecem.

## Bloqueio atual 4.1.7 — peer dependencies (25/11/2026)

Saneamento inicial instalado parcialmente; resolução de peers falhou. Hotfix de manifestos preparado, ainda não validado. Etapa 4.1.7 continua aberta, 5.3 a 5.5 pendentes. Última suíte confirmada 718/83 antes da troca de versões. Este checkpoint prevalece sobre os históricos abaixo; não antecipar a 1.6.0.

## Resultado da preparação e bloqueio de release — 25/11/2026

A preparação local 1.5.0 passou em Prettier, ESLint, TypeScript e 718 testes (83 arquivos). 4.1.7 está bloqueada por 150 ocorrências de auditoria, 5 críticas; atualização de dependências entregue para validação, não homologada. 5.1/5.2 aplicadas localmente; 5.3 ainda não executada, 5.4/5.5 pendentes. Revisão manual, política SEC-006, limpeza identificada de dados fictícios e commits ainda pendentes de confirmação. Este checkpoint prevalece sobre a previsão histórica abaixo.

Atualização: 2026-11-25. Fonte: documento de continuidade recuperado da conversa anterior e confirmação atual do desenvolvedor.

## Preparação consolidada — 25/11/2026

Entrega única de preparação da 1.5.0 solicitada pelo desenvolvedor. 4.1.4: aceite desktop e exclusões confirmado; validação final e commit pendentes. 4.1.5: revisão focal da política pública e reforço de cabeçalhos; aceite da política e homologação pendentes. 4.1.6: revisão focal financeira e reforço de upload; revisão integral pendente. 4.1.7: auditoria no instalador. 4.2/4.3: melhorias pontuais implementadas, revisão completa não comprovada. 4.4/4.5: regressão e identificação segura dos dados fictícios ainda necessárias. 5.1/5.2: versão local e changelog preparados; build, publicação e homologação em produção não comprovados. A sequência original abaixo permanece válida; não transferir pendências para 1.6.0 sem aprovação explícita.

## Versão 1.5.0

Versão atual do código: 1.4.0. Próximo release: 1.5.0.

- [x] Etapas 1 e 2 — Agendamentos e cuidados clínicos.
- [x] Etapa 3 — Financeiro, dashboards e gerenciamento de fotos.
- [x] 4.0 — Padronização com Prettier.
- [x] 4.1.1 — Inventário de segurança.
- [x] 4.1.2 — Segurança das identidades Clerk (validação automatizada aprovada conforme histórico).
- [x] 4.1.2.1 — Gerenciamento administrativo de identidades; funcionamento confirmado e suíte de 639 testes aprovada.
- [x] 4.1.2.2 — Migration 0047 aplicada e validada.
- [ ] 4.1.2.3 — Homologação e commit Clerk: validação aprovada; desenvolvedor informou faltar apenas commit; execução do commit a confirmar.
- [ ] 4.1.3 — Autorização dos agendamentos (SEC-003 e SEC-004) aplicação, validação automatizada e homologação funcional aprovadas pelo desenvolvedor; commit a confirmar.
- [ ] 4.1.4 — Segurança dos registros clínicos (SEC-005) (**etapa atual**): política compartilhada aprovada; exclusões homologadas, 691 testes em 80 arquivos aprovados; hotfix visual de observações entregue; validação final e commit pendentes.
- [ ] 4.1.5 — Segurança das receitas e PDFs (SEC-006).
- [ ] 4.1.6 — Revisão financeira e uploads.
- [ ] 4.1.7 — Auditoria de dependências.
- [ ] 4.2 — Revisão de interface e pluralização de todo o sistema. Layout dos detalhes do pet antecipado, v4 aprovada visualmente no desktop; limpeza entregue, validação final pendente; manter botões coloridos. Demais revisões da 4.2 permanecem pendentes.
- [ ] 4.3 — Qualidade de código, duplicações, imports não utilizados e código morto.
- [ ] 4.4 — Regressão geral.
- [ ] 4.5 — Limpeza final dos dados fictícios (identificar e autorizar antes de excluir; preservar dados reais).
- [ ] 5.1 — Atualização da versão para 1.5.0.
- [ ] 5.2 — Changelog.
- [ ] 5.3 — Build de produção.
- [ ] 5.4 — Publicação.
- [ ] 5.5 — Homologação em produção.

Não implementar estornos, desvinculação ou substituição administrativa de identidades nesta versão. Não iniciar Mercado Pago antes de concluir a 1.5.0.

## Versão 1.6.0 — Mercado Pago

Release independente, posterior à 1.5.0. Escopo inicial aprovado:

- Pagamento online pelo portal do tutor (`/my-finance`).
- Integração segura com Mercado Pago e webhooks.
- Idempotência e conciliação financeira.
- Atualização automática das cobranças.
- Prevenção de pagamentos duplicados, inclusive entre tutores do mesmo pet.
- Preservação dos pagamentos manuais existentes.

Não solicitar nem armazenar credenciais do Mercado Pago no código nesta etapa. Detalhamento técnico da integração ainda será definido; não presumir decisões adicionais.

## Preview v2 — 25/11/2026

Ajuste do preview antecipado 4.2: restaurar cabeçalho original, equalizar botões e unificar painéis Histórico/Linha do Tempo. Demais abas ainda provisórias. Homologação pendente, incluindo perfil Customer. Não muda a sequência de segurança/release.

## Preview v3 — 25/11/2026

Ajuste de apresentação aprovado: cabeçalho original; ações clínicas coloridas compactas à esquerda e histórico à direita, com divisão igual em telas grandes (2xl), empilhando em telas menores. Mantém painel de Linha do Tempo e regras do Customer da v2. Preview antecipado da 4.2 ainda em homologação; não altera a sequência do release.

## Preview v4 — 25/11/2026

Ajuste pontual solicitado na homologação da v3: preencher toda a largura da coluna de ações, sem aumentar a altura dos botões nem mudar a divisão 50/50. Preview continua em homologação; próxima etapa de segurança permanece 4.1.5.

## Aceite da v4 e limpeza final — 25/11/2026

Layout aprovado pelo desenvolvedor no desktop; remover backup comentado e modo legado. Aguardar validação automatizada final e confirmação dos demais cenários antes do commit. A etapa 4.2 não está concluída; próxima etapa de segurança continua 4.1.5.
