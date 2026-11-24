# Padrão de testes

Vale para toda lógica e todo comportamento novo ou alterado. Dispensa quem só mexe em texto, estilo ou configuração sem efeito no comportamento.

- Escreva o teste primeiro (TDD): veja-o falhar pelo motivo certo, faça passar com o mínimo e então melhore o código.
- Corrigiu um bug? Primeiro um teste que reproduz o bug e falha, depois a correção.
- Nunca altere ou apague um teste só para ele passar. Se o teste está errado, diga por quê e confirme a regra antes de mudá-lo.
- Teste o comportamento visível (o que entra e o que sai), não os detalhes internos de como foi feito.
- Um teste, um comportamento. O nome diz o que acontece e em que situação.
- Cada teste é independente: não depende da ordem, de outro teste, de rede externa nem de dados que ele não criou.
- Use dublês (mocks) só nas fronteiras, como serviços externos, relógio e envio de e-mail. Não substitua o que você está testando.
- Rode a suíte inteira antes de cada commit. Não faça commit com teste quebrado.
- Cubra o caminho feliz, os limites (vazio, zero, máximo) e os erros que o usuário pode causar.
