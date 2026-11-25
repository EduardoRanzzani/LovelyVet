# LovelyVet — auditoria de segurança

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
