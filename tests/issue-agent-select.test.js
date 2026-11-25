const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const h = require('./helpers')

afterEach(h.cleanup)

const scriptPath = path.join(h.repoRoot, '.github', 'issue-agent', 'select-issues.js')
const { writeOutputs, writeSummary, normalizeAuthor, normalizeIssue, fetchIssues, parseMode } = require(scriptPath)

test('writeOutputs grava as saídas de qualquer modo no arquivo', () => {
  const file = path.join(h.tempDir('select-output'), 'out')
  writeOutputs(file, { classify: '3,5', reason: 'motivo' })
  assert.equal(fs.readFileSync(file, 'utf8'), 'classify=3,5\nreason=motivo\n')
})

test('writeSummary acrescenta o motivo ao resumo da execução', () => {
  const file = path.join(h.tempDir('select-summary'), 'summary')
  writeSummary(file, 'motivo')
  assert.match(fs.readFileSync(file, 'utf8'), /motivo/)
})

test('parseMode aceita só size-set e agent', () => {
  assert.equal(parseMode('size-set'), 'size-set')
  assert.equal(parseMode('agent'), 'agent')
  assert.throws(() => parseMode(undefined), /modo/)
  assert.throws(() => parseMode('outro'), /modo/)
})

for (const mode of ['size-set', 'agent']) {
  test(`sem GITHUB_TOKEN o modo ${mode} sai com erro em português`, () => {
    const result = spawnSync('node', [scriptPath, mode], { encoding: 'utf8', env: { PATH: process.env.PATH } })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /GITHUB_TOKEN/)
  })
}

test('sem o modo o script sai com erro em português', () => {
  const result = spawnSync('node', [scriptPath], { encoding: 'utf8', env: { PATH: process.env.PATH, GITHUB_TOKEN: 'x', GITHUB_REPOSITORY: 'a/b' } })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /modo/)
})

test('autor com caminho de app vira login com [bot]', () => {
  assert.equal(normalizeAuthor({ login: 'claude', resourcePath: '/apps/claude' }), 'claude[bot]')
})

test('usuário comum mantém o login, mesmo chamado claude', () => {
  assert.equal(normalizeAuthor({ login: 'claude', resourcePath: '/claude' }), 'claude')
})

test('autor nulo de conta apagada vira texto vazio', () => {
  assert.equal(normalizeAuthor(null), '')
})

test('normalizeIssue converte o nó da API para o formato da seleção', () => {
  const node = {
    number: 9,
    createdAt: '2026-01-01T00:00:00Z',
    authorAssociation: 'OWNER',
    assignees: { totalCount: 2 },
    labels: { nodes: [{ name: 'Size: P' }] },
    closedByPullRequestsReferences: { totalCount: 1 },
    comments: { nodes: [{ body: 'oi', author: { login: 'claude', resourcePath: '/apps/claude' } }, { body: 'x', author: null }] }
  }
  const normalized = normalizeIssue(node)
  assert.equal(normalized.assignees.length, 2)
  assert.deepEqual(normalized.labels, ['Size: P'])
  assert.equal(normalized.linkedPullRequests, 1)
  assert.deepEqual(normalized.comments.map((comment) => comment.author), ['claude[bot]', ''])
})

function stubFetch(implementation) {
  const original = globalThis.fetch
  globalThis.fetch = implementation
  return () => {
    globalThis.fetch = original
  }
}

test('falha de rede na API dá erro em português', async () => {
  const restore = stubFetch(async () => {
    throw new TypeError('fetch failed')
  })
  try {
    await assert.rejects(fetchIssues('token', 'a/b'), /Não foi possível falar com a API do GitHub/)
  } finally {
    restore()
  }
})

test('resposta GraphQL sem repositório dá erro em português', async () => {
  const restore = stubFetch(async () => ({ ok: true, json: async () => ({ data: { repository: null } }) }))
  try {
    await assert.rejects(fetchIssues('token', 'a/b'), /repositório a\/b/)
  } finally {
    restore()
  }
})
