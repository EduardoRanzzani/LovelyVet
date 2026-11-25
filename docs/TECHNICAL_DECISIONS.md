# LovelyVet — decisões técnicas e de negócio

Atualização: 2026-11-25. Decisões recuperadas do documento de continuidade e padrões acordados nesta conversa.

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
