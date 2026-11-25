const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const h = require('./helpers')

const scriptPath = path.join(h.repoRoot, '.github', 'issue-agent', 'execution-report.js')
const { redact, deniedCommands, buildSummary } = require(scriptPath)

test('troca o valor exato de cada segredo por asteriscos', () => {
  const text = 'saida com tokenSecretoLongo123 no meio e outra vez tokenSecretoLongo123'
  assert.equal(redact(text, ['tokenSecretoLongo123']), 'saida com *** no meio e outra vez ***')
})

test('ignora segredo vazio ou curto demais para não apagar texto comum', () => {
  assert.equal(redact('abc abc', ['', undefined, 'abc']), 'abc abc')
})

test('troca tokens conhecidos do GitHub e da Anthropic mesmo sem o valor exato', () => {
  const text = [
    'ghs_abcdefghijklmnopqrstuvwxyz0123456789',
    'ghp_abcdefghijklmnopqrstuvwxyz0123456789',
    'github_pat_abcdefghijklmnopqrstuvwxyz0123456789',
    'sk-ant-oat01-abcdefghijklmnopqrstuvwxyz0123456789',
    'Authorization: Bearer abcdefghijklmnopqrstuvwxyz0123456789'
  ].join('\n')
  const result = redact(text, [])
  assert.doesNotMatch(result, /ghs_|ghp_|github_pat_|sk-ant-|abcdefghijklmnopqrstuvwxyz/)
})

test('lista os comandos barrados do resultado da execução', () => {
  const messages = [
    { type: 'assistant' },
    {
      type: 'result',
      permission_denials: [
        { tool_name: 'Bash', tool_input: { command: 'git fetch origin' } },
        { tool_name: 'Read', tool_input: { file_path: '/etc/passwd' } },
        { tool_name: 'Agent', tool_input: {} }
      ]
    }
  ]
  assert.deepEqual(deniedCommands(messages), [
    'Bash: git fetch origin',
    'Read: /etc/passwd',
    'Agent'
  ])
})

test('sem resultado ou sem barrados a lista é vazia', () => {
  assert.deepEqual(deniedCommands([{ type: 'assistant' }]), [])
  assert.deepEqual(deniedCommands([{ type: 'result' }]), [])
  assert.deepEqual(deniedCommands('não é lista'), [])
})

test('o resumo mostra a quantidade e cada comando barrado sem deixar crase quebrar o texto', () => {
  const summary = buildSummary(['Bash: echo `x`', 'Agent'])
  assert.match(summary, /^## Comandos barrados$/m)
  assert.match(summary, /2/)
  assert.match(summary, /^- `Bash: echo 'x'`$/m)
  assert.match(summary, /^- `Agent`$/m)
})

test('o resumo diz quando nenhum comando foi barrado', () => {
  assert.match(buildSummary([]), /Nenhum comando foi barrado/)
})
