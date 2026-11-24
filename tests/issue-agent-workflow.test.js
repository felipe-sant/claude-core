const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const h = require('./helpers')

const workflowPath = path.join(h.repoRoot, '.github', 'workflows', 'issue-agent.yml')
const workflow = () => fs.readFileSync(workflowPath, 'utf8')

function jobBlock(name) {
  const lines = workflow().split('\n')
  const start = lines.findIndex((line) => line === `  ${name}:`)
  assert.notEqual(start, -1, `job ${name} não encontrado`)
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => /^ {2}\S/.test(line))
  return rest.slice(0, end === -1 ? undefined : end).join('\n')
}

function topLevel() {
  const text = workflow()
  return text.slice(0, text.indexOf('\njobs:'))
}

test('o workflow dispara em issue aberta ou reaberta, na varredura diária e na mão', () => {
  const top = topLevel()
  assert.match(top, /issues:\n\s+types: \[opened, reopened\]/)
  assert.match(top, /schedule:\n\s+- cron: "0 9 \* \* \*"/)
  assert.match(top, /workflow_dispatch:\n/)
})

test('a concorrência é serial, com grupo fixo', () => {
  assert.match(topLevel(), /concurrency:\n\s+group: issue-agent\n\s+cancel-in-progress: false/)
})

test('o topo não dá nenhuma permissão', () => {
  assert.match(topLevel(), /^permissions: \{\}$/m)
})

test('a seleção tem só leitura de conteúdo, issues e pull requests', () => {
  const block = jobBlock('select')
  assert.match(block, /permissions:\n\s+contents: read\n\s+issues: read\n\s+pull-requests: read\n/)
  assert.doesNotMatch(block, /write/)
})

test('o agente tem as quatro permissões exatas', () => {
  const block = jobBlock('agent')
  assert.match(block, /permissions:\n\s+contents: write\n\s+issues: write\n\s+pull-requests: write\n\s+id-token: write\n/)
})

test('a seleção não usa o segredo do Claude nem a ação do Claude', () => {
  const block = jobBlock('select')
  assert.doesNotMatch(block, /CLAUDE_CODE_OAUTH_TOKEN/)
  assert.doesNotMatch(block, /claude-code-action/)
})

test('a seleção expõe as quatro saídas do script', () => {
  const block = jobBlock('select')
  for (const output of ['classify', 'pr_allowed', 'pr_issue', 'reason']) {
    assert.match(block, new RegExp(`${output}: \\$\\{\\{ steps\\.select\\.outputs\\.${output} \\}\\}`))
  }
})

test('o agente só roda quando há issue para classificar ou pull request a abrir', () => {
  const block = jobBlock('agent')
  assert.match(block, /needs: select/)
  assert.match(block, /if: needs\.select\.outputs\.classify != '' \|\| needs\.select\.outputs\.pr_issue != ''/)
})

test('o segredo é CLAUDE_CODE_OAUTH_TOKEN, passado pela entrada da ação', () => {
  assert.match(jobBlock('agent'), /claude_code_oauth_token: \$\{\{ secrets\.CLAUDE_CODE_OAUTH_TOKEN \}\}/)
})

test('a ação do Claude está fixada pelo SHA do commit e nunca em tag móvel ou main', () => {
  const text = workflow()
  assert.match(text, /uses: anthropics\/claude-code-action@[0-9a-f]{40}\n/)
  assert.doesNotMatch(text, /@main/)
})

test('a ação não recebe github_token nem mostra a saída completa', () => {
  const text = workflow()
  assert.doesNotMatch(text, /^\s+github_token:/m)
  assert.doesNotMatch(text, /show_full_output: true/)
})

test('o contexto filtrado é gerado antes da ação do Claude', () => {
  const block = jobBlock('agent')
  const context = block.indexOf('issue-context.js')
  assert.notEqual(context, -1)
  assert.ok(context < block.indexOf('claude-code-action'))
})

test('as ferramentas são restritas e o que lê issue de outro jeito ou faz merge é proibido', () => {
  const block = jobBlock('agent')
  assert.match(block, /--allowedTools/)
  assert.match(block, /--disallowedTools/)
  const disallowed = block.slice(block.indexOf('--disallowedTools'))
  for (const forbidden of ['gh pr merge', 'gh issue view', 'gh api', 'git push --force', 'git push origin main']) {
    assert.ok(disallowed.includes(forbidden), `faltou proibir: ${forbidden}`)
  }
})

test('a conferência final roda sempre e confere a principal, o tamanho, o comentário e o limite de pull requests', () => {
  const block = jobBlock('agent')
  assert.match(block, /if: always\(\)/)
  assert.match(block, /refs\/heads\/main/)
  assert.match(block, /Size:/)
  assert.match(block, /Tamanho definido pelo agente de issues/)
  assert.match(block, /Aberto pelo agente de issues\./)
})

test('o checkout do agente baixa o histórico inteiro', () => {
  assert.match(jobBlock('agent'), /fetch-depth: 0/)
})

test('nenhum campo de texto livre da issue ou do comentário é interpolado', () => {
  const text = workflow()
  assert.doesNotMatch(text, /github\.event\.issue\.(title|body)/)
  assert.doesNotMatch(text, /github\.event\.comment/)
})

test('o workflow não tem comentários', () => {
  assert.doesNotMatch(workflow(), /^\s*#/m)
})

test('o checkout do agente não deixa o token gravado na configuração do git', () => {
  assert.match(jobBlock('agent'), /uses: actions\/checkout@v4\n\s+with:\n\s+fetch-depth: 0\n\s+persist-credentials: false/)
})
