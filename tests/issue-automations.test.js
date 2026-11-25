const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const h = require('./helpers')
const { readWorkflow, topLevel, REQUIRED_DISALLOWED } = require('./issue-workflow-helpers')

const exists = (...parts) => fs.existsSync(path.join(h.repoRoot, ...parts))
const sizeSet = readWorkflow('issue-size-set.yml')
const claudeAgent = readWorkflow('issue-claude-agent.yml')
const both = [
  ['Issue Size Set', sizeSet],
  ['Issue Claude Agent', claudeAgent]
]
const script = fs.readFileSync(path.join(h.repoRoot, '.github', 'issue-agent', 'select-issues.js'), 'utf8')

const jobNames = (text) => [...text.slice(text.indexOf('\njobs:')).matchAll(/^ {2}(\w+):$/gm)].map((match) => match[1])

test('a automação antiga e o prompt antigo não existem mais', () => {
  assert.equal(exists('.github', 'workflows', 'issue-agent.yml'), false)
  assert.equal(exists('.github', 'issue-agent', 'prompt.md'), false)
})

test('os testes da automação antiga não existem mais', () => {
  assert.equal(exists('tests', 'issue-agent-workflow.test.js'), false)
  assert.equal(exists('tests', 'issue-agent-prompt.test.js'), false)
})

test('as duas automações usam o mesmo grupo de concorrência serial', () => {
  for (const [name, text] of both) {
    assert.match(topLevel(text), /concurrency:\n\s+group: issue-agent\n\s+cancel-in-progress: false/, name)
  }
})

test('as duas automações usam o mesmo segredo do Claude', () => {
  for (const [name, text] of both) {
    assert.match(text, /claude_code_oauth_token: \$\{\{ secrets\.CLAUDE_CODE_OAUTH_TOKEN \}\}/, name)
  }
})

test('as duas automações usam a mesma ação, fixada pelo mesmo SHA', () => {
  const shas = both.map(([, text]) => text.match(/claude-code-action@([0-9a-f]{40})/)[1])
  assert.equal(shas[0], shas[1])
})

test('as duas automações levam a mesma lista de proibições, completa', () => {
  const lists = both.map(([, text]) => text.match(/--disallowedTools '([^'\n]*)'/)[1])
  assert.equal(lists[0], lists[1])
  for (const rule of REQUIRED_DISALLOWED) assert.ok(lists[0].includes(rule), `faltou proibir: ${rule}`)
})

test('a Issue Claude Agent não dispara por issue nem por chamada de outro workflow', () => {
  assert.doesNotMatch(topLevel(claudeAgent), /^\s+issues:/m)
  assert.doesNotMatch(claudeAgent, /workflow_call/)
})

test('a marca do comentário e a linha do pull request são iguais no script e nas duas automações', () => {
  const mark = script.match(/CLASSIFICATION_MARK = '([^']+)'/)[1]
  const line = script.match(/PULL_REQUEST_LINE = '([^']+)'/)[1]
  for (const [name, text] of both) {
    assert.ok(text.includes(`CLASSIFICATION_MARK: ${mark}`), name)
    assert.ok(text.includes(`PULL_REQUEST_LINE: ${line}`), name)
  }
})

test('o contexto runner não aparece fora dos passos em nenhum trabalho', () => {
  for (const [name, text] of both) {
    for (const job of jobNames(text)) {
      const block = require('./issue-workflow-helpers').jobBlock(text, job)
      const steps = block.indexOf('    steps:')
      assert.doesNotMatch(block.slice(0, steps), /runner\./, `${name}: ${job}`)
    }
  }
})

test('a pasta do contexto é definida a partir de runner.temp em cada passo que a usa', () => {
  for (const [name, text] of both) {
    const uses = text.match(/"\$CONTEXT_DIR"|: %s\\n.*\$CONTEXT_DIR/g) || []
    const definitions = text.match(/CONTEXT_DIR: \$\{\{ runner\.temp \}\}\/issue-agent/g) || []
    assert.ok(uses.length > 0, name)
    assert.equal(definitions.length, 2, name)
  }
})

test('as listas de números são expandidas entre aspas no shell', () => {
  for (const [name, text] of both) {
    assert.doesNotMatch(text, /(^|[^"])\$\{CLASSIFY\/\/,\/ \}/m, name)
    const commandLines = text.split('\n').filter((line) => !/fail "|echo "/.test(line))
    assert.doesNotMatch(commandLines.join('\n'), /[^"{]\$PR_ISSUE(\s|$)/m, name)
  }
  assert.match(sizeSet, /"\$\{numbers\[@\]\}"/)
})

test('o shell das duas automações não tem crase dentro de aspas simples nem comentários', () => {
  for (const [name, text] of both) {
    const shellLines = text.split('\n').filter((line) => !line.trim().startsWith('--disallowedTools'))
    assert.doesNotMatch(shellLines.join('\n'), /'[^'\n]*`[^'\n]*'/, name)
    assert.doesNotMatch(text, /^\s*#/m, name)
  }
})

test('nenhum texto livre da issue ou do comentário é interpolado nas duas automações', () => {
  for (const [name, text] of both) {
    assert.doesNotMatch(text, /github\.event\.(issue|comment)/, name)
  }
})
