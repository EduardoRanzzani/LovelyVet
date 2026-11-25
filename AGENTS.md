# LovelyVet — instruções de desenvolvimento

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
