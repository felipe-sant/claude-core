---
paths:
  - "app/**/*.ts"
  - "start/**/*.ts"
  - "database/**/*.ts"
  - "config/**/*.ts"
---

# Padrão AdonisJS

Vale para a aplicação AdonisJS deste projeto. Siga a versão do framework que o projeto usa (veja o `package.json`) e as convenções que ele já tem.

- Controllers finos: recebem a requisição, chamam a regra e respondem. Regra de negócio vai para services ou actions em `app/`, não para o controller nem para a rota.
- Valide toda entrada com validators (VineJS nas versões atuais), nunca usando `request.all()` direto.
- As rotas ficam em `start/routes.ts`, agrupadas por domínio e protegidas por middleware de autenticação quando precisam de login.
- Models Lucid só descrevem dados e relações. Para evitar consultas repetidas em listas, carregue relações com `preload`.
- Alterações de banco só por migration; nunca edite uma migration já aplicada em outro ambiente, crie uma nova.
- Variáveis de ambiente passam pelo módulo `env` do Adonis, com validação na subida, e não por `process.env` espalhado.
- Erros usam exceções com status HTTP certo e são tratados pelo handler de exceções da aplicação.
- Testes com Japa: funcionais para as rotas (cliente HTTP) e unitários para a regra de negócio, com banco isolado por teste.
