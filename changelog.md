## Histórico de alterações

> Candidato local 1.5.0: 731 testes em 85 arquivos, audit-prod sem vulnerabilidades conhecidas, Drizzle check e build Next 16.4.5 aprovados em 25/11/2026. Audit-all mantém duas ocorrências moderadas DEV aceitas temporariamente. Limpeza do histórico fictício do pet Teste confirmada pelo desenvolvedor. Commit, publicação e homologação em produção ainda pendentes.

### [1.5.0] - Candidato a release (25/11/2026)

- Agendamentos, reagendamento, vacinação, retornos e lembretes clínicos.
- Financeiro com cobranças, pagamentos manuais integrais e parciais, extratos e portal do tutor.
- Dashboards por perfil e alteração exclusiva de fotos de pets pelo tutor autorizado.
- Segurança Clerk por ambiente, vinculação administrativa e auditoria (migration 0047, já aplicada).
- Revalidação de autorização dos agendamentos e proteção transacional de exclusões clínicas.
- Correção da apresentação de observações com HTML sanitizado; layout responsivo dos detalhes do pet aprovado no desktop.
- Cabeçalhos de privacidade na validação pública de receitas, preservando a interoperabilidade atual com o ITI.
- Validação do conteúdo de imagens nos uploads da equipe e ajustes pontuais de pluralização.
- Sanitização adicional de HTML histórico nas telas, extração isomórfica de texto no catálogo e proteção de privacidade da busca de pets.
- Restrição de alteração de contas privilegiadas por Doctor no cadastro de clientes.
- Documentação de continuidade versionada; ver checkpoint e auditoria para validações e riscos ainda pendentes.

A versão ainda não está publicada. Validações automatizadas locais aprovadas; confirmar política de acesso público aos PDFs e homologação manual restante antes do push. Ver documentação de continuidade.

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
