# LovelyVet — decisões técnicas e de negócio

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
