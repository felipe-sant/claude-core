const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const h = require('./helpers')

afterEach(h.cleanup)

const scriptPath = path.join(h.repoRoot, '.github', 'issue-agent', 'select-issues.js')
const { selectIssues, MAX_CLASSIFY, writeOutputs } = require(scriptPath)

let counter = 0
function issue(overrides = {}) {
  counter += 1
  return {
    number: counter,
    createdAt: `2026-01-${String(counter).padStart(2, '0')}T00:00:00Z`,
    isPullRequest: false,
    authorAssociation: 'OWNER',
    assignees: [],
    labels: [],
    linkedPullRequests: 0,
    comments: [],
    ...overrides
  }
}

function select(issues, extra = {}) {
  return selectIssues({ issues, openPulls: [], branches: [], eventIssue: null, ...extra })
}

const agentComment = { author: 'claude[bot]', body: 'Tamanho definido pelo agente de issues: P' }

test('issue de quem não é colaborador é ignorada', () => {
  const result = select([issue({ authorAssociation: 'NONE' })])
  assert.deepEqual(result.classify, [])
  assert.equal(result.prIssue, '')
})

test('issue de colaborador sem tamanho vai para classificar', () => {
  const first = issue({ authorAssociation: 'COLLABORATOR' })
  const second = issue({ authorAssociation: 'MEMBER' })
  assert.deepEqual(select([first, second]).classify, [first.number, second.number])
})

test('issue com responsável é ignorada', () => {
  assert.deepEqual(select([issue({ assignees: ['felipe'] })]).classify, [])
})

test('issue com pull request ligado é ignorada', () => {
  assert.deepEqual(select([issue({ linkedPullRequests: 1 })]).classify, [])
})

test('pull request na lista de issues é ignorado', () => {
  assert.deepEqual(select([issue({ isPullRequest: true })]).classify, [])
})

test('issue com tamanho M ou G nunca é tratada', () => {
  const result = select([issue({ labels: ['Size: M'] }), issue({ labels: ['Size: G'] })])
  assert.deepEqual(result.classify, [])
  assert.equal(result.prIssue, '')
})

test('comentário de classificação do agente impede nova classificação', () => {
  assert.deepEqual(select([issue({ comments: [agentComment] })]).classify, [])
})

test('a mesma marca postada por outra pessoa não impede a classificação', () => {
  const forged = { author: 'estranho', body: 'Tamanho definido pelo agente de issues: M' }
  const target = issue({ comments: [forged] })
  assert.deepEqual(select([target]).classify, [target.number])
})

test('P sem pull request, branch e responsável vira pr_issue', () => {
  const target = issue({ labels: ['Size: P'] })
  const result = select([target])
  assert.equal(result.prIssue, target.number)
  assert.equal(result.prAllowed, true)
  assert.deepEqual(result.classify, [])
})

test('P com comentário de classificação do agente continua na fila', () => {
  const target = issue({ labels: ['Size: P'], comments: [agentComment] })
  assert.equal(select([target]).prIssue, target.number)
})

test('P que também tem M ou G nunca entra na fila', () => {
  const result = select([issue({ labels: ['Size: P', 'Size: M'] }), issue({ labels: ['Size: G', 'Size: P'] })])
  assert.equal(result.prIssue, '')
})

test('P com branch própria é ignorada', () => {
  const target = issue({ labels: ['Size: P'] })
  const result = select([target], { branches: [`feat/${target.number}-algo`] })
  assert.equal(result.prIssue, '')
})

test('branch de outro número não tira a P da fila', () => {
  const target = issue({ labels: ['Size: P'] })
  const result = select([target], { branches: [`feat/${target.number}0-algo`, 'main'] })
  assert.equal(result.prIssue, target.number)
})

test('P com responsável ou pull request ligado é ignorada', () => {
  const result = select([issue({ labels: ['Size: P'], assignees: ['x'] }), issue({ labels: ['Size: P'], linkedPullRequests: 1 })])
  assert.equal(result.prIssue, '')
})

test('pull request do agente aberto bloqueia pr_issue e mantém classify', () => {
  const queued = issue({ labels: ['Size: P'] })
  const fresh = issue()
  const result = select([queued, fresh], { openPulls: [{ author: 'claude[bot]', body: '' }] })
  assert.equal(result.prAllowed, false)
  assert.equal(result.prIssue, '')
  assert.deepEqual(result.classify, [fresh.number])
})

test('pull request com a linha fixa no corpo conta como do agente', () => {
  const result = select([], { openPulls: [{ author: 'felipe', body: 'Aberto pelo agente de issues.' }] })
  assert.equal(result.prAllowed, false)
})

test('pull request de outra pessoa não bloqueia', () => {
  const result = select([], { openPulls: [{ author: 'felipe', body: 'Closes #1' }] })
  assert.equal(result.prAllowed, true)
})

test('onze issues a classificar viram só as dez mais antigas', () => {
  const issues = Array.from({ length: MAX_CLASSIFY + 1 }, () => issue())
  const result = select(issues.reverse())
  assert.equal(MAX_CLASSIFY, 10)
  assert.deepEqual(result.classify, issues.map((entry) => entry.number).sort((a, b) => a - b).slice(0, 10))
})

test('duas P na fila escolhem a mais antiga', () => {
  const older = issue({ labels: ['Size: P'], createdAt: '2025-01-01T00:00:00Z' })
  const newer = issue({ labels: ['Size: P'] })
  assert.equal(select([newer, older]).prIssue, older.number)
})

test('evento com issue a classificar devolve só ela', () => {
  const other = issue()
  const target = issue()
  const result = select([other, target], { eventIssue: target.number })
  assert.deepEqual(result.classify, [target.number])
})

test('evento com P na fila devolve só ela em pr_issue', () => {
  const other = issue({ labels: ['Size: P'] })
  const target = issue({ labels: ['Size: P'] })
  const result = select([other, target], { eventIssue: target.number })
  assert.equal(result.prIssue, target.number)
  assert.deepEqual(result.classify, [])
})

test('evento com issue não elegível não escolhe nada mesmo havendo outras', () => {
  const other = issue()
  const target = issue({ assignees: ['x'] })
  const result = select([other, target], { eventIssue: target.number })
  assert.deepEqual(result.classify, [])
  assert.equal(result.prIssue, '')
})

test('nada elegível deixa tudo vazio', () => {
  const result = select([])
  assert.deepEqual(result.classify, [])
  assert.equal(result.prIssue, '')
  assert.equal(typeof result.reason, 'string')
})

test('writeOutputs grava as quatro saídas no arquivo', () => {
  const file = path.join(h.tempDir('select-output'), 'out')
  writeOutputs(file, { classify: [3, 5], prAllowed: false, prIssue: '', reason: 'motivo' })
  assert.equal(fs.readFileSync(file, 'utf8'), 'classify=3,5\npr_allowed=false\npr_issue=\nreason=motivo\n')
})

test('sem GITHUB_TOKEN o script sai com erro em português', () => {
  const result = spawnSync('node', [scriptPath], { encoding: 'utf8', env: { PATH: process.env.PATH } })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /GITHUB_TOKEN/)
})
