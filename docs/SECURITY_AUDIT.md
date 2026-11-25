# LovelyVet — auditoria de segurança

Atualização: 2026-11-25. Escopo: etapa 4.1 da versão 1.5.0. Não constitui auditoria integral concluída.

## Inventário original

- SEC-001 — Vinculação automática de identidades Clerk por e-mail: corrigida na 4.1.2, validação automatizada aprovada conforme histórico.
- SEC-002 — Consulta de identidades sem filtro por ambiente: corrigida na 4.1.2, validação automatizada aprovada conforme histórico.
- SEC-003 — Exclusão de agendamento da consulta de disponibilidade sem validação suficiente de titularidade: corrigida na 4.1.3; aplicação, validação automatizada e homologação funcional aprovadas conforme relato do desenvolvedor; commit pendente.
- SEC-004 — Autorização de agendamentos não revalidada integralmente dentro da transação: corrigida na 4.1.3; aplicação, validação automatizada e homologação funcional aprovadas conforme relato do desenvolvedor; commit pendente.
- SEC-005 — Revisar permissões de exclusão de registros clínicos entre veterinários: revisão de política, não vulnerabilidade comprovada; etapa 4.1.4.
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

PostgreSQL compartilhado entre Development e Production é limitação de isolamento; não alterar registros reais em testes. Não confundir separação de identidades Clerk com isolamento de dados. Não iniciar estornos ou desvinculação/substituição administrativa nesta versão. Não afirmar que testes ou auditorias passaram sem resultados. A etapa seguinte após homologação e commit da 4.1.3 é 4.1.4.
