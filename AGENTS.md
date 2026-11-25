# LovelyVet — instruções de desenvolvimento

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

## Histórico — checkpoint — 1.6.0 / referência Vena Imports (25/11/2026)

O desenvolvedor autorizou iniciar a implementação com base na análise do Vena Imports. Adotar Checkout Transparente (Orders API, SDK oficial backend e Card Payment Brick) como direção técnica do ciclo, Pix e crédito, débito inicialmente desabilitado, saldo integral restante. A integração ainda não foi implementada. O checkpoint anterior de Checkout Pro é histórico e foi substituído. Versão do código permanece 1.5.0.

Reutilizar conceitos, não copiar o serviço monolítico. Referência externa única por tentativa; idempotência estável em retries; consulta autenticada e validação de recebedor, ambiente, valor, moeda, IDs e referência. Nunca baixar saldo por estado do navegador. Separar tentativa, conciliação e recebimento; preservar pagamentos manuais e autoria. Não registrar cartões, segredos ou dados sensíveis do payload.

Etapa 1.1.1: decisão arquitetural registrada, instalação documental a validar. Etapa 1.1.2: isolamento de banco iniciado em planejamento; provisionamento e evidência ainda pendentes. Usar banco `lovelyvet-application-dev` em instância isolada preferencialmente, usuário distinto, Clerk Development e dados sintéticos. Não copiar produção, não alterar suas permissões automaticamente, não executar migration em banco compartilhado. `DATABASE_URL` é usada por runtime e Drizzle. Verificar conexão efetiva e histórico antes de qualquer migration; 0048 ainda não criada. Próximo passo: diagnóstico somente leitura e comprovação do isolamento, depois modelagem 1.2.1. Manter seis Markdown atualizados.

## Histórico — checkpoint — 1.6.0 / etapa 1.1 em planejamento (25/11/2026)

A versão publicada permanece 1.5.0; último resultado comprovado: 731 testes/85 arquivos. O desenvolvedor definiu uma conta recebedora por ambiente: sua própria conta para homologação (credenciais de teste) e a conta da esposa para produção (credenciais reais). Não implementar marketplace, split ou OAuth multi-recebedor. Não solicitar tokens no chat, não versionar segredos e não ativar cobranças reais nesta etapa. Preservar pagamentos manuais.

O banco atualmente compartilhado exige isolamento antes de testes de baixa financeira. Recomendação pendente de aceite: banco de homologação separado, com dados fictícios e Clerk Development. Enquanto compartilhado, não registrar pagamentos Mercado Pago de teste no ledger real nem executar testes de ponta a ponta que alterem cobranças reais. O pet Teste continua preservado; sua identificação não é barreira de segurança. Credenciais, webhook, URL de retorno, modo e conta recebedora esperada devem ser configurados por ambiente; validar em servidor. Feature flag desligada por padrão. Não inferir ambiente pelo prefixo do token ou apenas por NODE_ENV.

Próxima ação: aprovar o isolamento de homologação e as regras pendentes da etapa 1.1; em seguida modelar a migration 0048 (sem aplicação automática). Ler o roadmap e as decisões atuais; o checkpoint de publicação abaixo é histórico e não implica novas validações. Atualizar os seis Markdown em cada entrega.

## Histórico — checkpoint — 1.5.0 publicada e homologada (25/11/2026)

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
