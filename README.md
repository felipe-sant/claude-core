# claude-kit

Pacote npm que configura o Claude Code em qualquer repositório com o time de agentes, os padrões de desenvolvimento e as skills do projeto, escolhendo sozinho o que é de cada stack.

## Instalar e usar

Requer Node 22 ou mais novo. No repositório:

```
npm install --save-dev @felipe-sant/claude-kit
npx ai-sync
```

Abra o Claude no repositório e rode `/team-setup` para montar o time.

## Atualizar

```
npm install --save-dev @felipe-sant/claude-kit@latest
npx ai-sync
```

O `ai-sync` nunca sobrescreve nem apaga o que você editou ou criou.

## Opções

| Opção | O que faz |
| --- | --- |
| `--profile nome` | Escolhe um perfil à mão, no lugar da detecção da stack (veja abaixo). |
| `--force` | Reinstala também os arquivos em conflito, sobrescrevendo-os. |
| `--check` | Confere se o catálogo e os perfis estão consistentes. |
| `--teams` / `--no-teams` | Liga ou desliga o recurso experimental de times de agentes. |

Perfis (`--profile`), todos com as nove regras gerais e as skills gerais:

- `default`: o time completo.
- `frontend`: devs de tela e fullstack, com `designer`.
- `backend`: devs de API, banco e devops, sem `designer`.
- `tooling`: para repositórios de ferramentas, scripts e conteúdo, sem telas nem banco.

## O time

- `orchestrator`: a sessão principal depois de `/team-setup`. Fala com você e delega.
- `product-owner`: fonte das regras de negócio.
- `sdd`: escreve a especificação da tarefa.
- `executor`: ajudante dos devs nas tarefas mecânicas.
- `dev-frontend`, `dev-backend`, `dev-mobile`, `dev-devops`, `dev-database`, `dev-fullstack` e `dev-doc`: implementam.
- `reviewer`: revisa a entrega.
- `qa`: valida a entrega.
- `designer`: visual e experiência de uso.

Regras (9 gerais e 4 por stack), copiadas para `.claude/rules/`: `commit-standard`, `code-standard`, `testing-standard`, `security-standard`, `review-standard`, `git-standard`, `feedback-standard`, `pull-request-standard` e `issue-standard`. A `pull-request-standard` define a descrição do pull request com "O que muda", "Como foi verificado" e "Observações". Problema nas instruções do próprio time vira issue no `felipe-sant/claude-kit`, pelo `feedback-standard`.

### Subagentes ou time de agentes

Por padrão o time roda com subagentes. O time de agentes é opcional e experimental: ligue com `node bin/ai-sync.js --teams` (no repositório, `npx ai-sync --teams`) e desligue com `--no-teams`. O `ai-sync` nunca o liga sozinho.

### Commits, coautoria e `.env`

- Se o Claude Code negar o commit dos agentes, libere-o no `.claude/settings.local.json`: `{ "permissions": { "allow": ["Bash(git commit *)"] } }`.
- Para um repositório que proíbe a coautoria do Claude, use `"attribution": { "commit": "", "pr": "" }` no `.claude/settings.json`.
- Os agentes podem ler e copiar o `.env`, mas nunca imprimem os valores nem o commitam.

## Contribuir

Todo pull request traz uma nota de mudança (changeset) em `.changeset/`, com nome livre e único. Use `npm run changeset`, ou crie o arquivo à mão. Para documentação, textos, CI e testes, a nota é vazia (`npm run changeset -- --empty`).

| Tipo | Quando |
| --- | --- |
| major | Remove ou renomeia um agente, uma regra ou uma skill, muda o fluxo do time ou quebra uma opção do `ai-sync`. |
| minor | Novo agente, regra, skill, stack ou opção. |
| patch | Ajuste de texto, correção ou mudança que não quebra nada. |

Para testar uma mudança em outro repositório antes de publicar: `node bin/ai-sync.js /caminho/do/repo`.

O resto da documentação está na [wiki do repositório](https://github.com/felipe-sant/claude-kit/wiki).
