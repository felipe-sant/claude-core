const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')
const { spawnSync } = require('node:child_process')
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

test('troca também o cabeçalho basic que carrega x-access-token e o segredo em base64', () => {
  const secret = 'valorDoSegredoQualquer99'
  const encoded = Buffer.from(`x-access-token:${secret}`).toString('base64')
  const text = `Authorization: basic ${encoded}`
  const result = redact(text, [secret])
  assert.doesNotMatch(result, new RegExp(encoded.replace(/[+/=]/g, '\\$&')))
})

function runScript(sourceFile, env = {}) {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'report-'))
  const summaryFile = path.join(outputDir, 'summary.md')
  const result = spawnSync(process.execPath, [scriptPath, sourceFile, path.join(outputDir, 'saida')], {
    env: { ...process.env, GITHUB_STEP_SUMMARY: summaryFile, ...env },
    encoding: 'utf8'
  })
  const published = path.join(outputDir, 'saida', 'claude-execution-output.json')
  return { result, published, summaryFile, outputDir }
}

test('sem arquivo de entrada publica uma lista vazia e diz que nada foi barrado', () => {
  const { result, published, summaryFile, outputDir } = runScript(path.join(os.tmpdir(), 'nao-existe.json'))
  assert.equal(result.status, 0)
  assert.equal(fs.readFileSync(published, 'utf8'), '[]')
  assert.match(fs.readFileSync(summaryFile, 'utf8'), /Nenhum comando foi barrado/)
  fs.rmSync(outputDir, { recursive: true })
})

test('com JSON inválido publica o texto filtrado e não derruba o passo', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'entrada-'))
  const source = path.join(dir, 'entrada.json')
  fs.writeFileSync(source, 'quebrado com segredoDeTesteLongo1')
  const { result, published, outputDir } = runScript(source, { GITHUB_TOKEN: 'segredoDeTesteLongo1' })
  assert.equal(result.status, 0)
  assert.equal(fs.readFileSync(published, 'utf8'), 'quebrado com ***')
  fs.rmSync(outputDir, { recursive: true })
  fs.rmSync(dir, { recursive: true })
})

test('grava só a versão filtrada e o resumo sem o segredo', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'entrada-'))
  const source = path.join(dir, 'entrada.json')
  const messages = [{ type: 'result', permission_denials: [{ tool_name: 'Bash', tool_input: { command: 'echo segredoDeTesteLongo1' } }] }]
  fs.writeFileSync(source, JSON.stringify(messages))
  const { result, published, summaryFile, outputDir } = runScript(source, { CLAUDE_CODE_OAUTH_TOKEN: 'segredoDeTesteLongo1' })
  assert.equal(result.status, 0)
  assert.doesNotMatch(fs.readFileSync(published, 'utf8'), /segredoDeTesteLongo1/)
  assert.doesNotMatch(fs.readFileSync(summaryFile, 'utf8'), /segredoDeTesteLongo1/)
  assert.match(fs.readFileSync(summaryFile, 'utf8'), /echo \*\*\*/)
  assert.deepEqual(fs.readdirSync(path.join(outputDir, 'saida')), ['claude-execution-output.json'])
  fs.rmSync(outputDir, { recursive: true })
  fs.rmSync(dir, { recursive: true })
})
