---
paths:
  - "**/*.php"
---

# Padrão Laravel

Vale para a aplicação Laravel deste projeto. Se o projeto já tem uma convenção para algo abaixo (camada de serviços, pacote de testes, estrutura de pastas), siga a do projeto.

- Controllers finos: validam, chamam a regra e respondem. Regra de negócio vai para classes de ação ou serviço, não para o controller nem para o model.
- Valide toda entrada com `Form Request`, nunca com `$request->all()` direto no model. Defina `$fillable` nos models.
- Evite o problema N+1: carregue relações com `with()` antes de percorrer uma lista.
- Autorização por `Policy` e `Gate`, aplicada no controller ou na rota.
- Alterações de banco só por migration. Nunca edite uma migration já aplicada em outro ambiente; crie uma nova.
- Use `env()` só dentro dos arquivos de `config/`; no resto do código, use `config()`.
- Tarefas lentas (e-mail, relatórios, integrações) vão para filas (`jobs`), não para a requisição.
- Use `API Resources` para devolver JSON, sem expor o model inteiro.
- Testes com Pest ou PHPUnit, usando `RefreshDatabase` e factories; teste o comportamento HTTP com `$this->getJson` e afins.
