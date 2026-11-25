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
