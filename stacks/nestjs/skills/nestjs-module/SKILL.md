---
name: nestjs-module
description: Cria um módulo NestJS completo (module, controller, service e DTOs) com testes primeiro, seguindo o padrão do projeto. Use quando o usuário pedir um recurso, endpoint ou módulo novo na API.
---

# Módulo NestJS

Entrega: um módulo registrado na aplicação, com controller, service, DTOs validados e testes.

## Passos

1. Olhe um módulo existente e siga a estrutura de pastas, o acesso a dados e a autenticação do projeto. Siga também `.claude/rules/nestjs-standard.md`.
2. Defina o contrato: rotas, entradas, saídas e erros, com a regra de negócio confirmada.
3. Escreva primeiro os testes: unitários do service com `Test.createTestingModule` e dublês, e de ponta a ponta das rotas com `supertest`. Veja-os falhar.
4. Crie os DTOs com `class-validator` e tipos de resposta próprios, sem devolver a entidade do banco inteira.
5. Crie o service com a regra de negócio e o controller só com HTTP. Proteja as rotas com guards.
6. Registre o módulo na aplicação e exporte só o que outros módulos precisam.
7. Rode o lint, os testes e a compilação do projeto.
