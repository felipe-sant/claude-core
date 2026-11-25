const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const h = require('./helpers')

const scriptPath = path.join(h.repoRoot, '.github', 'issue-agent', 'progress-comment.js')
const { buildStartMessage, buildEndMessage } = require(scriptPath)

const RUN_URL = 'https://github.com/o/r/actions/runs/9'
const base = { runUrl: RUN_URL, pullRequestUrl: '', agentOutcome: 'success', openOutcome: 'success', failureReason: '', denied: [], limitReached: false, agentCommented: false }

test('o começo diz que o agente começou e traz o link da execução', () => {
  const message = buildStartMessage(RUN_URL)
  assert.match(message, /começou a trabalhar/)
  assert.ok(message.includes(RUN_URL))
})

test('com pull request aberto o fim diz isso e traz o link do pull request', () => {
  const message = buildEndMessage({ ...base, pullRequestUrl: 'https://github.com/o/r/pull/3' })
  assert.match(message, /abriu o pull request/)
  assert.ok(message.includes('https://github.com/o/r/pull/3'))
})

test('se o agente falhou pelo limite de uso o fim diz isso', () => {
  const message = buildEndMessage({ ...base, agentOutcome: 'failure', limitReached: true })
  assert.match(message, /limite de uso/)
})

test('se o agente falhou sem limite o fim diz que ele falhou e resume os comandos barrados', () => {
  const message = buildEndMessage({ ...base, agentOutcome: 'failure', denied: ['Bash: git fetch'] })
  assert.match(message, /falhou/)
  assert.match(message, /`Bash: git fetch`/)
})

test('se a abertura do pull request falhou o fim traz o motivo', () => {
  const message = buildEndMessage({ ...base, openOutcome: 'failure', failureReason: 'A descrição do pull request está vazia.' })
  assert.match(message, /não foi aberto/)
  assert.ok(message.includes('A descrição do pull request está vazia.'))
})

test('se o agente explicou em comentário o fim aponta para o comentário dele', () => {
  const message = buildEndMessage({ ...base, agentCommented: true })
  assert.match(message, /explicou o motivo em um comentário/)
})

test('se houve comandos barrados e nada foi feito o fim lista até três comandos', () => {
  const message = buildEndMessage({ ...base, denied: ['a', 'b', 'c', 'd'] })
  assert.match(message, /4 comandos foram barrados/)
  assert.ok(message.includes('`a`') && message.includes('`c`'))
  assert.ok(!message.includes('`d`'))
})

test('sem nada de útil o fim diz que o agente terminou sem fazer nada', () => {
  assert.match(buildEndMessage(base), /sem fazer nada/)
})

test('toda mensagem traz o link da execução e nunca a marca de classificação nem a palavra depende', () => {
  const cases = [base, { ...base, pullRequestUrl: 'https://github.com/o/r/pull/3' }, { ...base, agentOutcome: 'failure' }, { ...base, denied: ['x'] }]
  for (const state of cases) {
    const message = buildEndMessage(state)
    assert.ok(message.includes(RUN_URL))
    assert.doesNotMatch(message, /Tamanho definido pelo agente de issues|depende/i)
  }
  assert.doesNotMatch(buildStartMessage(RUN_URL), /Tamanho definido pelo agente de issues|depende/i)
})

test('o comando barrado vai entre crases sem quebrar o texto nem mencionar ninguém', () => {
  const message = buildEndMessage({ ...base, denied: ['Bash: echo `x` @alguem'] })
  assert.ok(message.includes("`Bash: echo 'x' @alguem`"))
})

test('o comando barrado muito longo é cortado em 200 caracteres com reticências', () => {
  const long = `Bash: ${'a'.repeat(500)}`
  const message = buildEndMessage({ ...base, denied: [long] })
  assert.ok(message.includes(`\`${long.slice(0, 200)}…\``))
  assert.ok(!message.includes('a'.repeat(250)))
  assert.ok(message.length < 600)
})

test('o comando barrado curto não ganha reticências', () => {
  assert.ok(buildEndMessage({ ...base, denied: ['Bash: ls'] }).includes('`Bash: ls`'))
})

test('quando o agente comentou na issue o comentário de acompanhamento é apagado', () => {
  const { shouldDeleteProgress } = require(scriptPath)
  assert.equal(shouldDeleteProgress({ ...base, agentCommented: true }), true)
})

test('quando o agente não comentou o comentário de acompanhamento é editado', () => {
  const { shouldDeleteProgress } = require(scriptPath)
  assert.equal(shouldDeleteProgress(base), false)
  assert.equal(shouldDeleteProgress({ ...base, pullRequestUrl: 'https://github.com/o/r/pull/3' }), false)
})

test('com pull request aberto o comentário é editado mesmo que o agente tenha comentado', () => {
  const { shouldDeleteProgress } = require(scriptPath)
  assert.equal(shouldDeleteProgress({ ...base, agentCommented: true, pullRequestUrl: 'https://github.com/o/r/pull/3' }), false)
})

function runEnd({ status, commented }) {
  const fs = require('node:fs')
  const os = require('node:os')
  const { spawnSync } = require('node:child_process')
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acompanhamento-'))
  const stub = path.join(dir, 'stub-fetch.js')
  const log = path.join(dir, 'calls.json')
  fs.writeFileSync(
    stub,
    [
      "const fs = require('node:fs')",
      'globalThis.fetch = async (url, options) => {',
      "  fs.appendFileSync(process.env.STUB_LOG, JSON.stringify({ url, method: options.method }) + '\\n')",
      '  const code = Number(process.env.STUB_STATUS)',
      '  return { ok: code < 400, status: code, json: async () => ({}) }',
      '}'
    ].join('\n')
  )
  fs.writeFileSync(path.join(dir, 'progress-comment-id'), '777')
  if (commented) fs.writeFileSync(path.join(dir, 'agent-commented'), 'yes\n')
  const result = spawnSync(process.execPath, ['--require', stub, scriptPath, 'end'], {
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH,
      STUB_LOG: log,
      STUB_STATUS: String(status),
      CHECK_DIR: dir,
      REPORT_DIR: dir,
      GITHUB_TOKEN: 'token-de-teste',
      GITHUB_REPOSITORY: 'o/r',
      GITHUB_SERVER_URL: 'https://github.com',
      GITHUB_RUN_ID: '9',
      PR_ISSUE: '5',
      AGENT_OUTCOME: 'success',
      OPEN_OUTCOME: 'skipped'
    }
  })
  const calls = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line)) : []
  fs.rmSync(dir, { recursive: true })
  return { result, calls }
}

test('apagar o acompanhamento chama DELETE no comentário certo e termina sem aviso', () => {
  const { result, calls } = runEnd({ status: 204, commented: true })
  assert.equal(result.status, 0)
  assert.deepEqual(calls, [{ url: 'https://api.github.com/repos/o/r/issues/comments/777', method: 'DELETE' }])
  assert.doesNotMatch(result.stdout, /::warning::/)
})

test('se a remoção falhar só sai um aviso e o passo não falha', () => {
  const { result, calls } = runEnd({ status: 404, commented: true })
  assert.equal(result.status, 0)
  assert.equal(calls.length, 1)
  assert.match(result.stdout, /::warning::.*404/)
})

test('sem comentário do agente o acompanhamento é editado com PATCH e nunca apagado', () => {
  const { result, calls } = runEnd({ status: 200, commented: false })
  assert.equal(result.status, 0)
  assert.deepEqual(calls, [{ url: 'https://api.github.com/repos/o/r/issues/comments/777', method: 'PATCH' }])
})
