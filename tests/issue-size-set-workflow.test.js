const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readWorkflow, jobBlock, topLevel, REQUIRED_DISALLOWED } = require('./issue-workflow-helpers')

const text = readWorkflow('issue-size-set.yml')
const job = (name) => jobBlock(text, name)
const allowedOf = (block) => block.slice(block.indexOf('--allowedTools'), block.indexOf('--disallowedTools'))
const disallowedOf = (block) => block.slice(block.indexOf('--disallowedTools'))

test('a automação se chama Issue Size Set', () => {
  assert.match(text, /^name: Issue Size Set$/m)
})

test('dispara em issue aberta ou reaberta, na varredura das 02:28 e na mão sem entradas', () => {
  const top = topLevel(text)
  assert.match(top, /issues:\n\s+types: \[opened, reopened\]/)
  assert.match(top, /schedule:\n\s+- cron: "28 5 \* \* \*"/)
  assert.match(top, /workflow_dispatch:\n\n/)
  assert.doesNotMatch(top, /inputs:/)
})

test('a concorrência é serial, no grupo issue-agent', () => {
  assert.match(topLevel(text), /concurrency:\n\s+group: issue-agent\n\s+cancel-in-progress: false/)
})

test('o topo não dá nenhuma permissão', () => {
  assert.match(topLevel(text), /^permissions: \{\}$/m)
})

test('as permissões de cada trabalho são exatas e nenhuma escreve conteúdo', () => {
  assert.match(job('select'), /permissions:\n\s+contents: read\n\s+issues: read\n\s+pull-requests: read\n/)
  assert.match(job('classify'), /permissions:\n\s+contents: read\n\s+issues: write\n\s+pull-requests: read\n\s+id-token: write\n/)
  assert.match(job('chain'), /permissions:\n\s+contents: read\n\s+issues: read\n\s+pull-requests: read\n\s+actions: write\n/)
  assert.doesNotMatch(text, /contents: write/)
})

test('a seleção roda o script no modo size-set e expõe classify e reason', () => {
  const block = job('select')
  assert.match(block, /run: node \.github\/issue-agent\/select-issues\.js size-set/)
  for (const output of ['classify', 'reason']) {
    assert.match(block, new RegExp(`${output}: \\$\\{\\{ steps\\.select\\.outputs\\.${output} \\}\\}`))
  }
  assert.doesNotMatch(block, /CLAUDE_CODE_OAUTH_TOKEN|claude-code-action/)
})

test('a classificação só roda com issues para classificar', () => {
  const block = job('classify')
  assert.match(block, /needs: select/)
  assert.match(block, /if: needs\.select\.outputs\.classify != ''/)
})

test('a ferramenta liberada é exatamente a do contrato', () => {
  const allowed = allowedOf(job('classify'))
  assert.ok(allowed.includes('--allowedTools "Read,Glob,Grep,Bash(gh issue comment:*),Bash(gh issue edit * --add-label *)"'))
  for (const forbidden of ['git', 'npm', 'node', 'Agent', 'Skill', 'Edit', 'Write', 'gh pr', '--remove-label']) {
    assert.ok(!allowed.includes(forbidden), `não deveria liberar: ${forbidden}`)
  }
})

test('as proibições obrigatórias estão entre aspas simples e sem crase solta', () => {
  const block = job('classify')
  const disallowed = disallowedOf(block)
  for (const rule of REQUIRED_DISALLOWED) assert.ok(disallowed.includes(rule), `faltou proibir: ${rule}`)
  assert.match(block, /--disallowedTools '[^'\n]*Bash\(\*\$\*\)[^'\n]*'/)
  assert.match(block, /--permission-mode dontAsk/)
  assert.match(block, /--max-turns 60/)
})

test('a ação do Claude é fixada por SHA, sem github_token e mostrando o relatório', () => {
  const block = job('classify')
  assert.match(block, /uses: anthropics\/claude-code-action@[0-9a-f]{40}\n/)
  assert.match(block, /claude_code_oauth_token: \$\{\{ secrets\.CLAUDE_CODE_OAUTH_TOKEN \}\}/)
  assert.match(block, /display_report: true/)
  assert.doesNotMatch(text, /^\s+github_token:/m)
  assert.doesNotMatch(text, /show_full_output: true/)
  assert.doesNotMatch(text, /@main/)
})

test('o checkout não guarda credenciais', () => {
  for (const name of ['select', 'classify', 'chain']) {
    assert.match(job(name), /uses: actions\/checkout@v4\n\s+with:\n(?:\s+.*\n)*?\s+persist-credentials: false/)
  }
})

test('a foto de antes fica fora da pasta que o Claude enxerga e vem antes da ação', () => {
  const block = job('classify')
  assert.match(block, /issue-check/)
  assert.doesNotMatch(block, /--add-dir [^\n]*issue-check/)
  assert.ok(block.indexOf('issue-check') < block.indexOf('claude-code-action'))
})

test('o contexto filtrado de classify é gerado antes da ação', () => {
  const block = job('classify')
  assert.ok(block.indexOf('issue-context.js') < block.indexOf('claude-code-action'))
  assert.match(block, /--add-dir \$\{\{ runner\.temp \}\}\/issue-agent/)
})

test('o prompt traz classify, a pasta e o link da execução e não usa o agente', () => {
  const block = job('classify')
  const step = block.slice(block.indexOf('id: prompt'), block.indexOf('id: claude'))
  assert.match(step, /size-set-prompt\.md/)
  assert.match(step, /\$GITHUB_SERVER_URL\/\$GITHUB_REPOSITORY\/actions\/runs\/\$GITHUB_RUN_ID/)
  assert.doesNotMatch(block, /agent-prompt\.md|pr_issue|npm ci/)
})

test('a conferência final roda sempre e confere principal, branches, pull requests e etiquetas', () => {
  const block = job('classify')
  const step = block.slice(block.indexOf('name: Conferência final'))
  assert.match(step, /if: always\(\)/)
  assert.match(step, /::error::/)
  for (const part of ['main', 'branches', 'pulls', 'labels-']) assert.ok(step.includes(part), `faltou conferir: ${part}`)
})

test('o encadeamento roda mesmo sem classificação, mas não depois de cancelamento', () => {
  const block = job('chain')
  assert.match(block, /needs: \[select, classify\]/)
  assert.match(block, /if: \$\{\{ !cancelled\(\) && needs\.select\.result == 'success' && \(needs\.classify\.result == 'success' \|\| needs\.classify\.result == 'skipped'\) \}\}/)
})

test('o encadeamento reconsulta o GitHub e só dispara com pr_issue, sem número', () => {
  const block = job('chain')
  assert.match(block, /select-issues\.js agent\n/)
  assert.match(block, /if: steps\.agent\.outputs\.pr_issue != ''/)
  assert.match(block, /gh workflow run issue-claude-agent\.yml --repo "\$GITHUB_REPOSITORY" --ref main\n/)
  assert.doesNotMatch(block, /REQUESTED_ISSUE|-f issue|--field/)
  assert.doesNotMatch(text, /workflow_run|upload-artifact|actions\/cache|workflow_call/)
})

test('o arquivo não tem comentários nem interpolação de texto livre', () => {
  assert.doesNotMatch(text, /^\s*#/m)
  assert.doesNotMatch(text, /\$\{\{ github\.event\.issue\.(title|body)/)
  assert.doesNotMatch(text, /\$\{\{ (inputs|github\.event)[^}]*\}\}/)
})

test('a Issue Size Set não autoriza nenhum bot na ação', () => {
  assert.doesNotMatch(text, /allowed_bots/)
})
