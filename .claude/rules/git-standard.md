# Padrão de git com vários agentes

Vale sempre que mais de um agente ou sessão usa a mesma worktree. Eles compartilham o stage (índice) do git, então um commit descuidado leva junto o trabalho do outro.

## Commit

- Adicione ao stage só os seus arquivos, pelo caminho exato: `git add caminho/arquivo.ts`. Nunca use `git add .`, `git add -A`, `git add -N` (nem `--intent-to-add`), `git add -u` nem `git commit -a`: todos levam junto o trabalho de outro agente ou deixam o stage com arquivos que não são seus.
- Commite com os caminhos explícitos: `git commit -m "Feat :sparkles: [#1] Adiciona X" -- caminho/a.ts caminho/b.ts`. Só esses caminhos entram no commit, e o que outro agente deixou no stage fica de fora. Para arquivo novo, faça `git add` dele antes; para remoção, `git rm` antes.
- Antes de commitar, rode `git status --short`. Depois, `git show --stat --name-status HEAD` e confirme que só os seus arquivos entraram.
- Se um arquivo de outro agente entrou no commit, não reescreva o histórico sozinho: avise o dev responsável e a orchestrator.
- Nunca rode `git reset`, `git restore`, `git checkout -- .`, `git stash` nem `git clean` sem caminhos: isso mexe nos arquivos dos outros.

## Isolar uma falha

Para descobrir se uma falha de teste vem do arquivo de outro agente, nunca use stash, reset, restore nem clean. Use uma destas saídas:

- Crie uma worktree própria a partir do último commit, fora da pasta da tarefa (`git worktree add ../<pasta>-isolada HEAD --detach`), rode o teste lá e remova-a ao fim (`git worktree remove ../<pasta>-isolada`).
- Ou avise o dono do arquivo e espere ele commitar.

## Coautoria

- Siga o que o repositório diz sobre coautoria (`CLAUDE.md` e `.claude/rules/`). Se ele proíbe a coautoria do Claude, nunca inclua `Co-Authored-By` na mensagem do commit nem a assinatura do Claude no pull request.
- Nesse caso, confira com `git log -1` depois de cada commit. Se a linha entrou, avise o dev responsável e a orchestrator em vez de reescrever o histórico sozinho.
- Sem proibição no repositório, siga a instrução de atribuição da sessão.

## Reescrever o histórico

`git rebase -i` abre um editor e não funciona sem terminal. Reescreva só commits seus, ainda não enviados, e com os outros agentes parados e o trabalho deles commitado: o rebase recusa rodar com alterações não commitadas. As linhas do rebase são numeradas a partir do commit mais antigo. Alternativas sem editor:

- Juntar uma correção a um commit anterior: `git commit --fixup=<hash>` e depois `GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash <hash>~1`.
- Juntar o commit da linha 2 ao da linha 1: `GIT_SEQUENCE_EDITOR="sed -i '2s/^pick/squash/'" GIT_EDITOR=true git rebase -i <base>`.
- Descartar o commit da linha 2: `GIT_SEQUENCE_EDITOR="sed -i '2s/^pick/drop/'" git rebase -i <base>`.
- Trocar a mensagem do commit da linha 1: `GIT_SEQUENCE_EDITOR="sed -i '1s/^pick/reword/'" GIT_EDITOR="sed -i '1s/.*/Nova mensagem/'" git rebase -i <base>`.
- Refazer em outra ordem: `git switch -c refeito <base>` e `git cherry-pick <hash1> <hash2>`.

Depois, confira com `git log --oneline` e `git status` antes de seguir.
