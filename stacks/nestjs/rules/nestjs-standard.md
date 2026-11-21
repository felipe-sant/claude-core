---
paths:
  - "**/*.module.ts"
  - "**/*.controller.ts"
  - "**/*.service.ts"
  - "**/*.dto.ts"
  - "**/*.guard.ts"
  - "**/*.pipe.ts"
  - "**/*.interceptor.ts"
  - "**/*.filter.ts"
---

# Padrão NestJS

Vale para a API NestJS deste projeto. Se o projeto já tem uma convenção para algo abaixo (ORM, autenticação, estrutura de pastas), siga a do projeto.

- Um módulo por domínio (`users`, `orders`), com seu controller, service e DTOs juntos. Módulos só exportam o que outros módulos precisam usar.
- O controller só trata HTTP: recebe, valida, chama o service e devolve. Regra de negócio fica no service e acesso a dados, em repositório ou no próprio service de dados.
- Toda entrada é um DTO com `class-validator`, com `ValidationPipe` global (`whitelist` e `forbidNonWhitelisted` ligados) e `transform`. Nunca use o corpo da requisição cru.
- Injete dependências pelo construtor e não crie serviços com `new`. Providers não guardam estado de uma requisição.
- Acesso é protegido com guards (autenticação e permissão) aplicados no controller ou globalmente, nunca conferido à mão dentro do service.
- Erros são exceções do Nest (`NotFoundException`, `BadRequestException`...) ou do domínio, traduzidas por um filtro de exceção. Não devolva `200` com mensagem de erro.
- Configuração vem do `ConfigModule` (variáveis de ambiente validadas na subida), não de `process.env` espalhado.
- Respostas usam tipos próprios, sem devolver a entidade do banco inteira (senha, campos internos).
- Testes unitários usam `Test.createTestingModule` com dependências trocadas por dublês; fluxos de ponta a ponta usam `supertest` contra a aplicação.
