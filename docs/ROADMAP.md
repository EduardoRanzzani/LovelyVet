# LovelyVet — roadmap oficial

Atualização: 2026-11-25. Fonte: documento de continuidade recuperado da conversa anterior e confirmação atual do desenvolvedor.

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
- [ ] 4.1.3 — Autorização dos agendamentos (SEC-003 e SEC-004) (**fechamento atual**): aplicação, validação automatizada e homologação funcional aprovadas pelo desenvolvedor; commit pendente.
- [ ] 4.1.4 — Segurança dos registros clínicos (SEC-005) — próxima após commit da 4.1.3.
- [ ] 4.1.5 — Segurança das receitas e PDFs (SEC-006).
- [ ] 4.1.6 — Revisão financeira e uploads.
- [ ] 4.1.7 — Auditoria de dependências.
- [ ] 4.2 — Revisão de interface e pluralização de todo o sistema.
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
