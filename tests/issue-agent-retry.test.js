const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const h = require('./helpers')

const retryPath = path.join(h.repoRoot, '.github', 'issue-agent', 'fetch-with-retry.js')
const { fetchWithRetry, retryPolicy } = require(retryPath)
const { request: selectRequest } = require(path.join(h.repoRoot, '.github', 'issue-agent', 'select-issues.js'))
const { request: contextRequest } = require(path.join(h.repoRoot, '.github', 'issue-agent', 'issue-context.js'))

const originalFetch = globalThis.fetch
const originalDelay = retryPolicy.delayMs
retryPolicy.delayMs = 0

afterEach(() => {
  globalThis.fetch = originalFetch
})

process.on('exit', () => {
  retryPolicy.delayMs = originalDelay
})

function sequence(...steps) {
  let calls = 0
  globalThis.fetch = async () => {
    const step = steps[Math.min(calls, steps.length - 1)]
    calls += 1
    if (step instanceof Error) throw step
    return step
  }
  return () => calls
}

const ok = { ok: true, status: 200, json: async () => ({ value: 1 }) }
const unavailable = { ok: false, status: 503, json: async () => ({}) }
const notFound = { ok: false, status: 404, json: async () => ({}) }
const networkError = new TypeError('fetch failed')

test('repete a chamada quando a API responde 5xx e devolve a resposta boa', async () => {
  const calls = sequence(unavailable, unavailable, ok)
  const response = await fetchWithRetry('https://api.github.com/x', {})
  assert.equal(response.status, 200)
  assert.equal(calls(), 3)
})

test('repete a chamada quando a rede falha', async () => {
  const calls = sequence(networkError, ok)
  const response = await fetchWithRetry('https://api.github.com/x', {})
  assert.equal(response.status, 200)
  assert.equal(calls(), 2)
})

test('não repete erro 4xx', async () => {
  const calls = sequence(notFound, ok)
  const response = await fetchWithRetry('https://api.github.com/x', {})
  assert.equal(response.status, 404)
  assert.equal(calls(), 1)
})

test('devolve o último 5xx depois de esgotar as tentativas', async () => {
  const calls = sequence(unavailable)
  const response = await fetchWithRetry('https://api.github.com/x', {})
  assert.equal(response.status, 503)
  assert.equal(calls(), retryPolicy.attempts)
})

test('propaga a falha de rede depois de esgotar as tentativas', async () => {
  const calls = sequence(networkError)
  await assert.rejects(fetchWithRetry('https://api.github.com/x', {}), /fetch failed/)
  assert.equal(calls(), retryPolicy.attempts)
})

for (const [name, request] of [['a seleção', selectRequest], ['o contexto', contextRequest]]) {
  test(`${name} se recupera de um 503 momentâneo`, async () => {
    const calls = sequence(unavailable, ok)
    assert.deepEqual(await request('token', 'https://api.github.com/x'), { value: 1 })
    assert.equal(calls(), 2)
  })

  test(`${name} não repete 404 e mantém o erro em português`, async () => {
    const calls = sequence(notFound, ok)
    await assert.rejects(request('token', 'https://api.github.com/x'), /A API do GitHub respondeu 404/)
    assert.equal(calls(), 1)
  })

  test(`${name} mantém a mensagem em português quando a rede falha sempre`, async () => {
    sequence(networkError)
    await assert.rejects(request('token', 'https://api.github.com/x'), /Não foi possível falar com a API do GitHub/)
  })

  test(`${name} dá erro em português quando o 503 persiste`, async () => {
    sequence(unavailable)
    await assert.rejects(request('token', 'https://api.github.com/x'), /A API do GitHub respondeu 503/)
  })
}
