# Problema no próprio time vira issue

Os agentes, as regras e as skills deste projeto vêm do `claude-core`, mantido no repositório `felipe-sant/claude-kit`. Quando o problema está nessas instruções, e não no código do projeto, ele é corrigido lá. Por isso, todo problema assim vira uma issue nesse repositório assim que aparece.

## O que conta como problema

- Um agente não consegue usar uma ferramenta ou chamar outro agente que a definição dele prevê.
- Uma regra, skill ou definição de agente está mal escrita, ambígua, incompleta ou contradiz outra.
- Seguir uma regra à risca dá errado (comando que não funciona, passo que falta, fluxo que trava).
- Um agente faz algo que a regra proíbe, ou deixa de fazer o que ela manda, porque a instrução não deixou claro.

Erro no código do projeto, teste falhando ou dúvida de regra de negócio não contam: seguem o fluxo normal do time.

## Quem abre

- Agente que não fala com o usuário: relate o problema à orchestrator (ou a quem o chamou) no relatório, em uma seção "Problema no time", com o que aconteceu e qual instrução estava envolvida. Não abra a issue.
- A sessão que fala com o usuário (a orchestrator, ou a sessão comum sem time) abre a issue sem pedir confirmação, assim que o problema aparecer, e depois avisa o usuário com o link.

## Como abrir

1. Procure uma issue parecida antes: `gh issue list --repo felipe-sant/claude-kit --state all --search "<palavras-chave>"`. Se já existir uma aberta, comente nela o caso novo (`gh issue comment`) em vez de abrir outra. Se só houver uma fechada, abra uma nova citando a antiga.
2. Abra com `gh issue create --repo felipe-sant/claude-kit --label bug --title "<título>" --body-file <arquivo>`, usando um arquivo temporário para o corpo.
3. Escreva o título e o corpo como manda o `issue-standard`, com as quatro seções da issue de bug.

Em "Causa provável", cite o agente, a regra ou a skill e o trecho da instrução (o nome do arquivo no `claude-core`, como `agents/dev-backend.md`), não do projeto.

## O que nunca vai na issue

O `felipe-sant/claude-kit` é público. Nunca coloque na issue código, caminhos de arquivo, nomes de cliente, de empresa ou do projeto, dados de negócio, mensagens de erro com dados reais, segredos nem conteúdo do `.env`. Descreva a situação de forma genérica ("um dev, ao rodar o gate de uma tarefa de backend...").

## Se não der para abrir

Se o `gh` não estiver instalado, não estiver autenticado ou não tiver acesso ao repositório, não insista: mostre ao usuário o título e o corpo prontos e diga o motivo, para ele abrir à mão.
