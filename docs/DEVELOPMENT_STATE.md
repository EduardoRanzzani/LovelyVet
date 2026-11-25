# LovelyVet — estado do desenvolvimento

## Checkpoint vigente — fechamento local 1.5.0 (25/11/2026)

- Revisão final aplicada no Mac. Frozen-lock, Prettier, ESLint sem warnings, TypeScript e Vitest 4.1.12 aprovados: **731 testes em 85 arquivos**, 19,29 s. Os 13 casos adicionais de HTML, busca de pets e cadastro de clientes passaram. Lockfile SHA-256 `fdaf5809425bbd43a3cd0e2b3a6906e1d96db66977b4521ed7dd513efee0f406`. Audit-prod sem vulnerabilidades conhecidas. Audit-all reprovado apenas por duas ocorrências moderadas DEV já aceitas expressamente; nenhuma nova ocorrência. Drizzle check aprovado e build Next 16.4.5/Turbopack aprovado (compilação 4,7 s, TypeScript 5,1 s, geração 24/24). Evidências do log enviado, não execução neste ambiente.
- Limpeza 4.5: pet Teste, UUID `c943e3cd-d2bb-4c19-a386-5a8e56899128`, banco `lovelyvet-application`. Inventário anterior: 1 pet, 3 vínculos com tutores, 1 atendimento, 1 item de serviço, 1 vacina; demais 12 indicadores de histórico zerados. Conferidas nove foreign keys no banco real. Escopo aprovado: preservar cadastro, foto, tutores e demais pets; limpar apenas histórico fictício. Desenvolvedor confirmou a conclusão da limpeza. Três exclusões previstas (vacina, vínculo de serviço e atendimento); não foi apresentado o log de execução, inventário posterior ou comprovante do backup. Não reexecutar o SQL; conferir estado pós-limpeza sem escrita se necessário. Nenhuma nova migration; 0047 já aplicada.
- Git status após revisão: 31 arquivos modificados e 8 novos, 39 no total. Últimos commits comprovados a242e84, 5e5bf2d e 5ccb794. Entrega exclusivamente documental; não altera código, dependências ou banco. Desenvolvedor solicitou commit e publicação. Preparar stage explícito e revisar diff; commit `release: v1.5.0`. Hash, push e deploy ainda não comprovados.
- Antes do push: confirmar política de acesso aos PDFs assinados por link (risco residual de acesso por portador do link), regressão manual mínima Admin/Doctor/Customer e mobile, assinatura/ITI, e-mail (Nodemailer 10), uploads, agenda e financeiro. O aceite desktop e a homologação das exclusões clínicas foram confirmados anteriormente; não há evidência individual dos demais fluxos no histórico disponível. Revisão estática foi focal, não auditoria integral/pentest. Não declarar homologação plena nem produção publicada sem evidência. Após deploy, registrar hash, ambiente, versão e homologação, mantendo backlog de riscos e 1.6.0 para depois.

## Checkpoint vigente — revisão estática final, 25/11/2026

- ZIP completo recebido antes do commit: 399 arquivos TS/TSX/MTS contabilizados como TS/TSX (399 TS/TSX), 83 arquivos de teste, package.json 1.5.0, Next 16.4.5, Vitest 4.1.12, sem CLI Shadcn. Lockfile SHA-256 `fdaf5809425bbd43a3cd0e2b3a6906e1d96db66977b4521ed7dd513efee0f406`, igual ao log do checkpoint. Migration 0047 SHA-256 igual ao histórico; não reaplicar. Última validação comprovada: 718/83, audit-prod limpo, audit-all duas moderadas DEV, Drizzle check e build aprovados. Não reexecutados neste ambiente.
- O desenvolvedor aceitou expressamente, em 25/11/2026, manter temporariamente as duas ocorrências moderadas exclusivamente DEV: GHSA-67mh-4wv8-2f99 (esbuild via Drizzle Kit) e GHSA-g3hv-75wg-m249 (minimatch via TypeScript ESLint). Aguardar atualização compatível dos consumidores, sem forçar majors, sem ocultar advisories e sem expor servidores dev a terceiros. Aceite restrito a esses dois advisories, condicionado a audit-prod sem alertas e ausência de novos advisories ou mudança de gravidade/escopo. Audit-all continua com seu resultado real; qualquer alerta adicional bloqueia o release. Fixes transitivos existem segundo o log, mas a compatibilidade não foi demonstrada. Revisar no próximo ciclo de manutenção.
- Revisão estática focal em autorizações e consultas clínicas, billing, uploads, HTML armazenado, hooks, configuração/manifestos e schema. Encontradas e tratadas três classes de problemas: HTML legado em quatro pontos de renderização (sanitização e preservação da estrutura da receita), DOMParser global no SSR do catálogo, busca por nome de tutor alheio em pet compartilhado, e escrita de dados de usuário privilegiado por Doctor no cadastro de clientes. Doctor pode continuar editando contas Customer; Admin mantém acesso. Removido bloco HTML comentado residual do histórico. Sem mudança de dependências, layout V4, regras clínicas, banco, QR, PDF assinado ou migration.
- 13 testes adicionais previstos (4 HTML, 4 busca, 5 cadastro), total esperado 731 testes/85 arquivos. Validar Prettier, ESLint, TypeScript, Vitest, auditorias e build no Mac. Testes e build anteriores não validam este novo patch. Revisão não equivale a pentest nem auditoria exaustiva. Não há acesso ao banco, ambiente Clerk, SMTP ou Cloudinary real neste ambiente.
- Próxima ação: instalar pacote de revisão, enviar log e inventário SQL somente leitura. Limpeza dos registros fictícios será antes do commit; aprovar IDs, dependências, backup e transação explícita. Não excluir dados reais, PDFs assinados, pagamentos, cadastros/configurações ou identidades Clerk sem decisão específica. Não executar migration 0047. Política de acesso público por link e homologações manuais restantes não foram expressamente confirmadas pelo usuário no histórico disponível; solicitar confirmação específica antes do deploy. Após revisão e limpeza, revalidar, registrar resultados, preparar git add explícito e commit `release: v1.5.0`; deploy e homologação em produção ainda pendentes. Não iniciar 1.6.0.

## Checkpoint prioritário — candidato 1.5.0 compilado (25/11/2026)

- Pacote auditoria-dev instalado no Mac com pnpm 12.21.0; remoção confirmada de shadcn 3.8.5 e 197 pacotes. Instalação estrita e frozen-lock aprovados; Prettier, ESLint sem warnings, TypeScript e Vitest 4.1.12 aprovados: 718 testes em 83 arquivos, 18,06 s. Os dois logs de falha de foto são cenários negativos esperados e as suítes passaram.
- Audit-prod: nenhuma vulnerabilidade conhecida. Audit-all: duas ocorrências moderadas (esbuild GHSA-67mh-4wv8-2f99 e minimatch GHSA-g3hv-75wg-m249); zero críticas/altas/baixas no relatório atual. Histórico: 150 -> 4 -> 2. Drizzle check aprovado; verifica consistência local, não aplica migrations nem prova estado do banco. Build Next 16.4.5/Turbopack aprovado, compilação 10,8 s, TypeScript 10,2 s, geração 24/24. O instalador retornou falha pelo gate audit-all; build e Drizzle check foram diagnósticos. Não houve publicação.
- Últimos commits confirmados: a242e84 (agendamentos SEC-003/004), 5e5bf2d (gestão administrativa Clerk) e 5ccb794 (provisionamento Clerk). Git status: 24 arquivos modificados e 5 novos, todos no bloco de registros clínicos, layout, preparação 1.5.0, dependências e documentação. Não há commit de encerramento 4.1.4 ou release confirmado. Revisar diff e stage explicitamente; não incluir arquivos locais desconhecidos.
- Este pacote registra evidências apenas, sem alterar código, manifestos, lockfile ou regras dos gates. Proposta para decisão do desenvolvedor: aceite temporário e explícito dos dois advisories DEV, condicionado a manter audit-prod limpo, sem novas ocorrências e sem expor servidores de desenvolvimento ou executar lint/Drizzle com entradas não confiáveis. Priorizar atualização compatível dos consumidores no próximo ciclo de manutenção; não usar overrides de major nem ignore para zerar o relatório. Sem aceite registrado, publicação permanece bloqueada.
- Antes de publicar: confirmar política de acesso por link a PDFs assinados (SEC-006), regressão manual mínima Admin/Doctor/Customer e mobile, assinatura/validação ITI, e-mail após Nodemailer 10, upload, agenda e financeiro; revisão integral restante ainda não comprovada. Identificar dados fictícios antes de qualquer exclusão ou decidir explicitamente adiar a limpeza. Não aplicar migration 0047 novamente. Após aceite, registrar decisões/pendências, commit revisado, publicação e homologação em produção. Não antecipar 1.6.0.

## Checkpoint prioritário — auditoria residual de desenvolvimento (25/11/2026)

- Hotfix de peers aplicado e confirmado no Mac com pnpm 12.21.0. Instalação estrita, frozen-lock, Prettier, ESLint sem warnings, TypeScript e Vitest 4.1.12 aprovados: 718 testes em 83 arquivos, 19,11 s.
- Audit de produção: nenhuma vulnerabilidade conhecida. Audit completo: 4 ocorrências (1 alta, 3 moderadas, zero críticas), redução de 150 para 4. Zod 3 e @hono/node-server via Shadcn CLI; esbuild legado via Drizzle Kit; minimatch via Shadcn CLI e ESLint. Drizzle check e build não executados pelo gate anterior.
- Entrega `LovelyVet-1.5.0-auditoria-dev.zip`: retirar somente Shadcn CLI das devDependencies; no código de referência, não há importação do pacote nem script que o execute. Componentes UI e components.json preservados. Manter workspace, strict peers e lockfile real; não forçar majors de esbuild/minimatch. Conferir o código local antes de aplicar; CLI futuro deve ser avaliado e invocado sob demanda com versão auditada.
- Executar instalação, frozen-lock, format, check, audit-prod, audit-all, Drizzle check e build. Caso apenas audit-all falhe, rodar Drizzle check e build como diagnóstico local; manter retorno não zero e bloqueio de publicação. Não confundir sucesso de build com aceite de risco. Se restarem alertas, analisar caminhos/versões e eventual decisão explícita sobre risco residual de desenvolvimento; não registrar aceite presumido. Pendências manuais, SEC-006, revisão restante, identificação de dados fictícios, commits e deploy continuam abertas.

## Checkpoint prioritário — hotfix de peer dependencies (25/11/2026)

- Saneamento inicial aplicado no Mac. A instalação baixou Next 16.4.5 e resolveu 73 adições/80 remoções, mas terminou com `ERR_PNPM_PEER_DEP_ISSUES`: node-forge instalado 1.4.4 versus exigido 1.4.3; Zod 3.25.76 (ferramentas) e 4.6.7 (aplicação) versus exigido 4.6.6. Não houve nova execução dos testes, auditorias, Drizzle check ou build. Última evidência: 718 testes/83 arquivos aprovados antes da atualização das dependências; audit anterior 150 ocorrências, cinco críticas.
- Hotfix: fixar dependências diretas node-forge 1.4.4 e Zod 4.6.7; remover somente os dois overrides globais que interferem nas faixas de peers; preservar compatibilidade do Zod 3 nas ferramentas, sujeito a nova auditoria. Manter instalação estrita. Não aprovar skills de terceiros automaticamente.
- Aplicar `LovelyVet-1.5.0-hotfix-peer-dependencies.zip` sobre o primeiro saneamento já aplicado. O lockfile pode ter sido modificado pela tentativa anterior; não substituir por lockfile antigo, guardar cópia do lockfile presente e regenerar com pnpm. Confirmar install, frozen-lock, format, check, audit-prod, audit-all, Drizzle check e build. Se houver falhas, não publicar. Não há nova contagem de testes nem auditoria aprovada. Pendências manuais, SEC-006 e revisão restante continuam abertas; commits e deploy não confirmados.

## Checkpoint prioritário — auditoria bloqueou a publicação (25/11/2026)

- Preparação 1.5.0 aplicada; log do Mac: Prettier, ESLint sem warnings, TypeScript e Vitest aprovados; **718 testes em 83 arquivos**, 21,71 s. Layout final e testes dos PDFs/uploads incluídos. A contagem de 708 anterior era previsão, não execução isolada.
- `pnpm audit` falhou: 150 ocorrências (5 críticas, 43 altas, 81 moderadas, 21 baixas). Drizzle check e build não foram executados pelo instalador (gate interrompido). Nenhum deploy ou commit confirmado.
- Entrega de saneamento: atualizar versões diretas e transitivas selecionadas em `package.json` e `pnpm-workspace.yaml`; gerar lockfile real pelo pnpm no Mac, preservando backup e verificando a resolução. Os alvos são derivados do audit fornecido, não verificados no registry neste ambiente. Não forçar atualização principal de dependências transitivas incompatíveis.
- Próxima ação: instalar `LovelyVet-1.5.0-auditoria-dependencias.zip`, conferir logs de instalação, Prettier, lint, typecheck, Vitest, audit de produção e completo, Drizzle check e build. Qualquer falha bloqueia a publicação. Se persistirem alertas, analisar a árvore de dependências (especialmente minimatch, esbuild legado, Zod 3 e @hono/node-server 1), sem ignorá-los. Confirmar homologação mobile/Customer, ITI/PDF, e demais pendências do roadmap. Não aplicar migration nem excluir dados reais. Não iniciar 1.6.0.

Atualização: 2026-11-25 (America/Campo_Grande).

## Checkpoint prioritário — preparação consolidada da 1.5.0

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

## Checkpoint atual — 4.1.4

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

## Próximas ações exatas

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
