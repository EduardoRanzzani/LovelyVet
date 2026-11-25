# LovelyVet — instruções de desenvolvimento

## Checkpoint vigente — 1.5.0 publicada e homologada (25/11/2026)

A versão 1.5.0 está publicada e homologada em produção conforme confirmação expressa do desenvolvedor em 25/11/2026. Os 12 itens do checklist de produção foram aprovados. Última suíte local comprovada: 731 testes em 85 arquivos; frozen-lock, Prettier, ESLint, TypeScript, audit-prod, Drizzle check e build Next 16.4.5 aprovados. Não confundir essa evidência local com execução de testes em produção. Hash do commit de release, URL e logs de deploy não foram fornecidos; registrar quando disponíveis.

Próxima etapa de desenvolvimento: planejamento da 1.6.0 (Mercado Pago), após versionar este fechamento exclusivamente documental. Ler os quatro documentos em `docs/` e `changelog.md` antes de retomar; usar o ZIP mais recente. Não reabrir a 1.5.0 sem motivo concreto, não repetir a limpeza do pet Teste nem a migration 0047. Manter pet, foto e tutores para homologações. Os dois advisories moderados exclusivamente DEV continuam aceitos temporariamente; não ocultar alertas. SEC-006 (política pública de PDFs por link), revisões complementares e riscos residuais permanecem registrados, sem presumir aceite específico da política ou auditoria integral. Não alterar versão, código, dependências ou banco nesta entrega.

Os checkpoints anteriores abaixo são históricos, não instruções vigentes. Em caso de divergência, este checkpoint e os registros vigentes dos quatro documentos prevalecem. Toda entrega, inclusive hotfix, deve atualizar os seis Markdown conforme os resultados reais e decisões pertinentes.

## Histórico — Checkpoint vigente — candidato 1.5.0 pronto para commit (25/11/2026)

O log final do Mac confirmou 731 testes em 85 arquivos, Prettier, ESLint, TypeScript, frozen-lock, audit-prod, Drizzle check e build Next 16.4.5 aprovados. Audit-all permaneceu reprovado exclusivamente por GHSA-67mh-4wv8-2f99 e GHSA-g3hv-75wg-m249, moderadas DEV expressamente aceitas até atualização compatível. Não ocultar alertas; bloquear novos advisories ou alterações de gravidade/escopo. O desenvolvedor confirmou a limpeza do histórico fictício do pet Teste, mantendo seu cadastro, foto e três vínculos com tutores, e solicitou commit e publicação. Não repetir o SQL de limpeza nem a migration 0047. A confirmação é do desenvolvedor; backup e inventário pós-exclusão não foram apresentados. Registrar evidências adicionais quando disponíveis.

Este checkpoint prevalece sobre os históricos abaixo. Preparar commit explícito `release: v1.5.0` com os 39 caminhos do último Git status; não publicar automaticamente. Antes do push para a branch de produção, verificar os fluxos manuais restantes e o aceite da política de PDF público por link; não presumir homologação. Registrar hash do commit, deploy e homologação real em `docs/DEVELOPMENT_STATE.md` após confirmação. Não iniciar 1.6.0 antes do fechamento em produção. Preservar os seis Markdown.

## Histórico — Checkpoint vigente — revisão final 1.5.0 (25/11/2026)

O desenvolvedor aceitou expressamente, em 25/11/2026, manter temporariamente as duas ocorrências moderadas exclusivamente DEV: GHSA-67mh-4wv8-2f99 (esbuild via Drizzle Kit) e GHSA-g3hv-75wg-m249 (minimatch via TypeScript ESLint). Aguardar atualização compatível dos consumidores, sem forçar majors, sem ocultar advisories e sem expor servidores dev a terceiros. Aceite restrito a esses dois advisories, condicionado a audit-prod sem alertas e ausência de novos advisories ou mudança de gravidade/escopo. Audit-all continua com seu resultado real; qualquer alerta adicional bloqueia o release. Fixes transitivos existem segundo o log, mas a compatibilidade não foi demonstrada. Revisar no próximo ciclo de manutenção.

O ZIP atualizado recebido corresponde à versão 1.5.0 e ao lockfile aprovado anteriormente. Consultar o checkpoint mais recente em `docs/DEVELOPMENT_STATE.md`; este bloco prevalece sobre instruções históricas de bloqueio absoluto por audit-all. Não publicar automaticamente. Revisão estática focal encontrou pontos em HTML histórico, busca por tutor e edição de contas privilegiadas por Doctor; correções entregues, testes reais pendentes. Limpeza do banco antes do release aprovada como etapa, mas nenhum ID ou exclusão foi autorizado. Usar somente consultas de leitura para inventário, backup e aprovação nominal dos IDs antes de elaborar script transacional. Não marcar homologações não confirmadas. Preservar os seis Markdown em cada entrega.

## Checkpoint de release — build aprovado, risco DEV pendente

Em 25/11/2026, após retirada do CLI Shadcn, instalação estrita, frozen-lock, Prettier, ESLint, TypeScript, 718 testes/83 arquivos, audit-prod, Drizzle check e build Next 16.4.5 aprovados. Audit-all permanece reprovado por duas ocorrências moderadas exclusivamente dev (esbuild e minimatch). O gate atual permanece bloqueante. Recomenda-se avaliar aceite formal e restrito dos dois advisories, sem ocultá-los, em vez de forçar versões incompatíveis. Não há aceite concedido, commit de release ou deploy. Consultar o checkpoint prioritário em `docs/DEVELOPMENT_STATE.md` e não iniciar 1.6.0.

## Checkpoint de release — auditoria residual dev

Em 25/11/2026, instalação estrita, frozen-lock e 718 testes/83 arquivos aprovados; audit-prod sem alertas conhecidos e audit-all com quatro ocorrências dev. Retirada do Shadcn CLI proposta, sem remover componentes UI. O instalador pode executar Drizzle check/build para diagnóstico se somente audit-all falhar; deve terminar com erro e não liberar publicação nesse caso. Não ignorar alertas nem registrar aceite de risco sem decisão explícita. Consultar o checkpoint prioritário em docs/DEVELOPMENT_STATE.md antes de continuar.

## Retomada em qualquer conversa

Ao receber um ZIP do projeto, leia primeiro este arquivo e os quatro documentos abaixo, antes de propor alterações:

1. `docs/DEVELOPMENT_STATE.md`: checkpoint, evidências e próxima ação.
2. `docs/ROADMAP.md`: escopo e sequência das versões.
3. `docs/TECHNICAL_DECISIONS.md`: decisões e padrões vigentes.
4. `docs/SECURITY_AUDIT.md`: ocorrências, evidências e riscos.

Use exclusivamente a versão mais recente do código anexado. Confira o código, scripts, versão e migrations contra os documentos. Informe divergências, sem sobrescrever evidências ou presumir resultados. Continue da primeira etapa pendente do checkpoint; não reinicie o planejamento nem reabra etapas concluídas sem motivo concreto. Não dependa do histórico do chat.

## Entregas incrementais

- Entregar ZIP com arquivos completos novos ou alterados, caminhos relativos à raiz, `01-aplicar-e-validar.sh`, `hashes.json` e `README.md` com instalação e homologação.
- Informar caminhos, alterações específicas, testes e limitações.
- Validar hashes do pacote e da base anterior antes de escrever. Fazer backup automático e bloquear alterações locais inesperadas.
- Usar o Prettier do projeto; executar `pnpm format:check` e `pnpm check`. Se necessário, executar `pnpm exec tsc --noEmit`, `pnpm exec eslint .` e `pnpm exec vitest run` separadamente.
- Incluir testes automatizados pertinentes a cada alteração funcional. Não inventar testes para uma entrega exclusivamente documental; testar seu instalador.
- Nunca afirmar que testes passaram sem evidência. Separar implementação, aplicação, validação automatizada, homologação e commit.
- Nunca executar commits automaticamente. Após homologação do bloco, fornecer comandos específicos de `git add` e `git commit`.
- Nunca aplicar migrations automaticamente no instalador. Conferir banco, histórico Drizzle, backup e hashes antes de orientar a aplicação.
- Não alterar registros reais para testes. Desenvolvimento e produção usam instâncias Clerk distintas, mas compartilham PostgreSQL.

## Código e interface

- Preservar arquitetura, componentes compartilhados, identidade visual e escopo da etapa.
- Respeitar Prettier, tabs, aspas simples, ponto e vírgula e React 19; evitar `setState` desnecessário em `useEffect`.
- Validar autorização no servidor, não só na interface. Evitar duplicações e código morto.
- Interface em português, responsiva, badges de status padronizados. Não implementar dark mode.
- Singular apenas para quantidade 1; zero e demais quantidades no plural. Não usar formas como `pet(s)`, `plantão(ões)` e `cobrança(s)`.
- Mostrar a versão apenas para Admin.

## Atualização da documentação

Após cada avanço relevante, atualizar o checkpoint com data, etapa, arquivos afetados, comandos e resultados efetivamente conhecidos, pendências, riscos e próxima ação. Atualizar o roadmap quando houver progresso ou mudança aprovada; registrar decisões e evidências nos documentos correspondentes. Incluir os Markdown atualizados nos pacotes incrementais sempre que mudarem. Não marcar como concluído algo que aguarda confirmação do desenvolvedor. Manter os documentos no Git junto com o código.

## Fechamento de release

Toda entrega, inclusive hotfix ou ajuste visual, deve atualizar os documentos de continuidade pertinentes. Registrar resultados reais, não previsões, e distinguir preparação local de publicação. Executar auditoria de dependências e build antes da publicação; nunca excluir dados fictícios sem identificação e autorização. Verificar histórico Git e preservar pendências de segurança e homologação. Não executar publicação automaticamente.

## Gate de dependências

Registrar resultado de `pnpm audit` e `pnpm audit --prod`, versões propostas e lockfile real; não ocultar advisories nem forçar majors transitivas sem verificar compatibilidade. Preservar backup do lockfile. Falha de build, audit-prod ou novos advisories bloqueia publicação. Para audit-all, a única exceção de risco aceita é o par DEV descrito no checkpoint vigente; não modificar o comando ou ocultar sua falha. Exigir revisão do relatório antes do release.

Não desativar a validação estrita de peer dependencies para contornar conflitos; verificar o efeito dos overrides em faixas de peers e preservar o lockfile atual sob backup após tentativas interrompidas. Não aprovar skills de terceiros automaticamente.
