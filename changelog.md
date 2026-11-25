## Histórico de alterações

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
