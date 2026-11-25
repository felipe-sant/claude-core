# Padrão de pull request e comentários

Vale ao abrir um pull request e ao escrever qualquer comentário em pull request ou em issue.

## Descrição do pull request

- O título segue o `commit-standard`.
- A descrição tem, nesta ordem, estes títulos de nível 2:

```
## O que muda
## Como foi verificado
## Observações
```

- O que muda diz o resultado para quem usa, não a lista de arquivos. Como foi verificado diz o que foi rodado, o resultado e o que não foi testado. Observações traz decisões, riscos e o que o revisor deve olhar com atenção.
- Escreva em linguagem simples, sem caminhos de arquivo nem código.
- Quando o pull request conclui uma issue, inclua `Closes #<número>`.

## Comentários

- Comentários em pull request, em issue e de revisão usam linguagem simples e vão direto ao ponto.
- Uma ideia por comentário.
- Fale do código, não da pessoa.
- Comentário de revisão classifica o achado e diz o problema e o que mudaria, como manda o `review-standard`.
