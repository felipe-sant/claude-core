const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const h = require('./helpers')
const { lintContent } = require('../lint/content')

afterEach(h.cleanup)

function fixture(files) {
  const root = h.tempDir('content')
  for (const [rel, content] of Object.entries(files)) h.write(path.join(root, rel), content)
  return root
}

const goodAgent = (name) => `---\nname: ${name}\ndescription: Faz algo\nmodel: sonnet\n---\n\nTexto\n`

test('os agentes, regras, perfis e catálogo do repositório estão no formato esperado', () => {
  assert.deepEqual(lintContent(h.repoRoot), [])
})

test('conteúdo bem formado não gera erros', () => {
  const root = fixture({
    'agents/qa.md': goodAgent('qa'),
    'rules/padrao.md': '# Padrão\n',
    'skills/demo/SKILL.md': '---\nname: demo\ndescription: Faz algo\n---\n\n# Demo\n',
    'profiles/default.json': '{ "agents": ["qa"], "rules": [] }\n',
    'catalog.json': '{}\n',
    'stacks/react/agents/dev-react.md': goodAgent('dev-react')
  })

  assert.deepEqual(lintContent(root), [])
})

test('agente sem cabeçalho, sem campo obrigatório ou com nome diferente do arquivo é reprovado', () => {
  const root = fixture({
    'agents/sem-cabecalho.md': 'só texto\n',
    'agents/sem-model.md': '---\nname: sem-model\ndescription: x\n---\n',
    'agents/nome-errado.md': goodAgent('outro-nome'),
    'agents/modelo-ruim.md': '---\nname: modelo-ruim\ndescription: x\nmodel: gpt\n---\n',
    'agents/MaiusculaErrada.md': goodAgent('MaiusculaErrada'),
    'agents/nao-md.txt': 'x'
  })
  const errors = lintContent(root).join('\n')

  assert.match(errors, /sem-cabecalho\.md: falta o cabeçalho/)
  assert.match(errors, /sem-model\.md: falta "model"/)
  assert.match(errors, /nome-errado\.md: "name" \(outro-nome\)/)
  assert.match(errors, /modelo-ruim\.md: "model" deve ser um de/)
  assert.match(errors, /MaiusculaErrada\.md: o nome do arquivo deve ser em minúsculas/)
  assert.match(errors, /nao-md\.txt: agente deve ser um arquivo \.md/)
})

test('regra sem título e skill sem SKILL.md ou com cabeçalho errado são reprovadas', () => {
  const root = fixture({
    'rules/sem-titulo.md': 'texto\n',
    'skills/vazia/outro.md': 'x\n',
    'skills/sem-cabecalho/SKILL.md': '# Só texto\n',
    'skills/nome-errado/SKILL.md': '---\nname: outro\ndescription: x\n---\n',
    'skills/sem-descricao/SKILL.md': '---\nname: sem-descricao\n---\n'
  })
  const errors = lintContent(root).join('\n')

  assert.match(errors, /sem-titulo\.md: a regra deve começar com um título/)
  assert.match(errors, /skills\/vazia: falta o SKILL\.md/)
  assert.match(errors, /skills\/sem-cabecalho\/SKILL\.md: falta o cabeçalho/)
  assert.match(errors, /skills\/nome-errado\/SKILL\.md: "name" \(outro\)/)
  assert.match(errors, /skills\/sem-descricao\/SKILL\.md: falta "description"/)
})

test('perfil com JSON inválido, chave desconhecida ou nomes repetidos é reprovado', () => {
  const root = fixture({
    'profiles/quebrado.json': '{ ruim',
    'profiles/chave.json': '{ "agentes": [] }\n',
    'profiles/repetido.json': '{ "agents": ["a", "a"] }\n',
    'profiles/formato.json': '{ "agents": "a" }\n',
    'catalog.json': '{}'
  })
  const errors = lintContent(root).join('\n')

  assert.match(errors, /quebrado\.json: JSON inválido/)
  assert.match(errors, /chave\.json: chave desconhecida "agentes"/)
  assert.match(errors, /repetido\.json: "agents" tem nomes repetidos/)
  assert.match(errors, /formato\.json: "agents" deve ser uma lista/)
  assert.match(errors, /catalog\.json: o arquivo deve terminar com uma quebra de linha/)
})

test('regra com paths válidos é aceita e regra com cabeçalho fora do formato é reprovada', () => {
  const ok = fixture({ 'rules/com-paths.md': '---\npaths:\n  - "**/*.tsx"\n---\n\n# Regra\n' })
  assert.deepEqual(lintContent(ok), [])

  const ruim = fixture({
    'rules/outra-chave.md': '---\ntitle: x\n---\n\n# Regra\n',
    'rules/sem-fechar.md': '---\npaths:\n  - "a"\n# Regra\n',
    'rules/sem-aspas.md': '---\npaths:\n  - a\n---\n\n# Regra\n',
    'rules/sem-titulo-depois.md': '---\npaths:\n  - "a"\n---\n\ntexto\n'
  })
  const errors = lintContent(ruim).join('\n')

  assert.match(errors, /outra-chave\.md: o cabeçalho da regra só aceita "paths:"/)
  assert.match(errors, /sem-fechar\.md: cabeçalho sem o "---" de fechamento/)
  assert.match(errors, /sem-aspas\.md: o cabeçalho da regra só aceita "paths:"/)
  assert.match(errors, /sem-titulo-depois\.md: a regra deve começar com um título/)
})

test('modelo de configuração que concede permissões amplas ou tem JSON inválido é reprovado', () => {
  const ok = fixture({ 'templates/settings.base.json': '{ "effortLevel": "medium", "permissions": { "deny": ["Read(./.env)"] } }\n' })
  assert.deepEqual(lintContent(ok), [])

  const ruim = fixture({
    'templates/settings.allow.json': '{ "permissions": { "allow": ["Bash(*)"] } }\n',
    'templates/settings.modo.json': '{ "permissions": { "defaultMode": "bypassPermissions" } }\n',
    'templates/settings.dirs.json': '{ "permissions": { "additionalDirectories": ["/"] } }\n',
    'templates/settings.quebrado.json': '{ ruim',
    'templates/settings.txt': 'x'
  })
  const errors = lintContent(ruim).join('\n')

  assert.match(errors, /settings\.allow\.json: o modelo não pode definir "permissions\.allow"/)
  assert.match(errors, /settings\.modo\.json: o modelo não pode definir "permissions\.defaultMode"/)
  assert.match(errors, /settings\.dirs\.json: o modelo não pode definir "permissions\.additionalDirectories"/)
  assert.match(errors, /settings\.quebrado\.json: JSON inválido/)
  assert.match(errors, /settings\.txt: modelo deve ser um arquivo \.json/)
})
