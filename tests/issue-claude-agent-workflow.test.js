const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readWorkflow, jobBlock, topLevel, REQUIRED_DISALLOWED } = require('./issue-workflow-helpers')

const text = readWorkflow('issue-claude-agent.yml')
const job = (name) => jobBlock(text, name)
const allowedOf = (block) => block.slice(block.indexOf('--allowedTools'), block.indexOf('--disallowedTools'))
const disallowedOf = (block) => block.slice(block.indexOf('--disallowedTools'))

test('o número da issue digitado só entra por env e nunca em um comando', () => {
  const matches = text.match(/\$\{\{ inputs\.issue \}\}/g) || []
  assert.equal(matches.length, 1)
  assert.match(job('select'), /env:\n(?:\s+.*\n)*?\s+REQUESTED_ISSUE: \$\{\{ inputs\.issue \}\}/)
  const runLines = text.split('\n').filter((line) => /^\s+(- )?run:/.test(line))
  for (const line of runLines) assert.doesNotMatch(line, /inputs\./)
})

test('a automação se chama Issue Claude Agent', () => {
  assert.match(text, /^name: Issue Claude Agent$/m)
})

test('dispara na mão com o campo issue opcional em texto e na varredura das 02:47', () => {
  const top = topLevel(text)
  assert.match(top, /workflow_dispatch:\n\s+inputs:\n\s+issue:\n\s+description: "Número da issue \(vazio: a P mais antiga da fila\)"\n\s+required: false\n\s+type: string/)
  assert.match(top, /schedule:\n\s+- cron: "47 5 \* \* \*"/)
  assert.doesNotMatch(top, /^\s+issues:/m)
  assert.doesNotMatch(text, /workflow_call/)
})

test('a concorrência é serial, no grupo issue-agent', () => {
  assert.match(topLevel(text), /concurrency:\n\s+group: issue-agent\n\s+cancel-in-progress: false/)
})

test('o topo não dá nenhuma permissão e as permissões dos trabalhos são exatas', () => {
  assert.match(topLevel(text), /^permissions: \{\}$/m)
  assert.match(job('select'), /permissions:\n\s+contents: read\n\s+issues: read\n\s+pull-requests: read\n/)
  assert.doesNotMatch(job('select'), /write/)
  assert.match(job('agent'), /permissions:\n\s+contents: write\n\s+issues: write\n\s+pull-requests: write\n\s+id-token: write\n/)
})

test('a seleção roda no modo agent e expõe pr_issue e reason, sem a ação do Claude', () => {
  const block = job('select')
  assert.match(block, /run: node \.github\/issue-agent\/select-issues\.js agent/)
  for (const output of ['pr_issue', 'reason']) {
    assert.match(block, new RegExp(`${output}: \\$\\{\\{ steps\\.select\\.outputs\\.${output} \\}\\}`))
  }
  assert.doesNotMatch(block, /CLAUDE_CODE_OAUTH_TOKEN|claude-code-action/)
})

test('o agente só roda quando há issue P para tratar', () => {
  const block = job('agent')
  assert.match(block, /needs: select/)
  assert.match(block, /if: needs\.select\.outputs\.pr_issue != ''/)
})

test('a ação do Claude é fixada por SHA, com o segredo certo e sem github_token', () => {
  const block = job('agent')
  assert.match(block, /uses: anthropics\/claude-code-action@[0-9a-f]{40}\n/)
  assert.match(block, /claude_code_oauth_token: \$\{\{ secrets\.CLAUDE_CODE_OAUTH_TOKEN \}\}/)
  assert.match(block, /^\s+display_report: true$/m)
  assert.doesNotMatch(text, /^\s+github_token:/m)
  assert.doesNotMatch(text, /show_full_output: true/)
  assert.doesNotMatch(text, /@main/)
})

test('o checkout baixa o histórico inteiro e não guarda credenciais', () => {
  assert.match(job('agent'), /uses: actions\/checkout@v4\n\s+with:\n\s+fetch-depth: 0\n\s+persist-credentials: false/)
  assert.match(job('select'), /uses: actions\/checkout@v4\n\s+with:\n\s+persist-credentials: false/)
})

test('o contexto filtrado só da pr_issue e a foto de antes vêm antes da ação', () => {
  const block = job('agent')
  assert.ok(block.indexOf('issue-context.js') < block.indexOf('claude-code-action'))
  assert.ok(block.indexOf('issue-check') < block.indexOf('claude-code-action'))
  assert.doesNotMatch(block, /--add-dir [^\n]*issue-check/)
  assert.match(block, /--add-dir \$\{\{ runner\.temp \}\}\/issue-agent/)
  assert.doesNotMatch(text, /CLASSIFY|classify/)
})

test('o prompt usa o agent-prompt, a pr_issue e o link da execução', () => {
  const block = job('agent')
  const step = block.slice(block.indexOf('id: prompt'), block.indexOf('id: claude'))
  assert.match(step, /agent-prompt\.md/)
  assert.match(step, /\$GITHUB_SERVER_URL\/\$GITHUB_REPOSITORY\/actions\/runs\/\$GITHUB_RUN_ID/)
  assert.match(step, /Link da execução: %s/)
})

test('o git é limitado aos subcomandos necessários e o checkout só cria branch', () => {
  const allowed = allowedOf(job('agent'))
  assert.ok(!allowed.includes('Bash(git:*)'))
  for (const subcommand of ['add', 'commit', 'push', 'switch', 'status', 'diff', 'log', 'branch', 'show', 'rev-parse']) {
    assert.ok(allowed.includes(`Bash(git ${subcommand}:*)`), `faltou permitir: git ${subcommand}`)
  }
  assert.ok(allowed.includes('Bash(git checkout -b:*)'))
  assert.ok(!allowed.includes('Bash(git checkout:*)'))
})

test('as ferramentas liberadas cobrem leitura, edição, subagentes, skills, npm e pull request', () => {
  const allowed = allowedOf(job('agent'))
  for (const tool of ['Read', 'Glob', 'Grep', 'Edit', 'Write', 'Agent', 'Skill']) {
    assert.match(allowed, new RegExp(`[",]${tool}[",]`), `faltou liberar: ${tool}`)
  }
  for (const rule of ['Bash(npm ci)', 'Bash(npm run lint)', 'Bash(npm test)', 'Bash(npm run sync)', 'Bash(node bin/ai-sync.js:*)', 'Bash(gh issue comment:*)', 'Bash(gh pr create:*)', 'Bash(gh pr list:*)']) {
    assert.ok(allowed.includes(rule), `faltou liberar: ${rule}`)
  }
})

test('a edição de issue só pode pôr e tirar etiquetas', () => {
  const block = job('agent')
  const allowed = allowedOf(block)
  assert.doesNotMatch(allowed, /gh issue edit:\*/)
  assert.ok(allowed.includes('Bash(gh issue edit * --add-label *)'))
  assert.ok(allowed.includes('Bash(gh issue edit * --remove-label *)'))
})

test('as proibições obrigatórias estão entre aspas simples, em dontAsk e com 100 turnos', () => {
  const block = job('agent')
  const disallowed = disallowedOf(block)
  for (const rule of REQUIRED_DISALLOWED) assert.ok(disallowed.includes(rule), `faltou proibir: ${rule}`)
  assert.match(block, /--disallowedTools '[^'\n]*Bash\(\*\$\*\)[^'\n]*'/)
  assert.match(block, /^\s+--permission-mode dontAsk$/m)
  assert.equal(block.match(/--permission-mode/g).length, 1)
  assert.match(block, /--max-turns 100/)
})

test('a conferência final roda sempre e exige Size P ou M, sem pull request se M', () => {
  const block = job('agent')
  const step = block.slice(block.indexOf('name: Conferência final'))
  assert.match(step, /if: always\(\)/)
  assert.match(step, /::error::/)
  assert.match(step, /refs\/heads\/main/)
  assert.match(step, /Size: P/)
  assert.match(step, /Size: M/)
  assert.match(step, /CLASSIFICATION_MARK/)
  assert.match(step, /PULL_REQUEST_LINE/)
  assert.match(block, /CLASSIFICATION_MARK: Tamanho definido pelo agente de issues/)
  assert.match(block, /PULL_REQUEST_LINE: Aberto pelo agente de issues\./)
  assert.match(step, /labels-/)
})

test('o runner só é usado dentro dos passos e a pasta do contexto vem de runner.temp', () => {
  for (const name of ['select', 'agent']) {
    const block = job(name)
    assert.doesNotMatch(block.slice(0, block.indexOf('    steps:')), /runner\./)
  }
  const definitions = job('agent').match(/CONTEXT_DIR: \$\{\{ runner\.temp \}\}\/issue-agent/g) || []
  assert.equal(definitions.length, 2)
})

test('o arquivo não tem comentários, interpolação de texto livre nem crase dentro de aspas simples', () => {
  assert.doesNotMatch(text, /^\s*#/m)
  assert.doesNotMatch(text, /github\.event\.(issue|comment)/)
  const shellLines = text.split('\n').filter((line) => !line.trim().startsWith('--disallowedTools'))
  assert.doesNotMatch(shellLines.join('\n'), /'[^'\n]*`[^'\n]*'/)
})
