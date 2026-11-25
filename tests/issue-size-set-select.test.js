const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const h = require('./helpers')

const { selectSizeSet, MAX_CLASSIFY } = require(path.join(h.repoRoot, '.github', 'issue-agent', 'select-issues.js'))

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

function select(issues, eventIssue = null) {
  return selectSizeSet({ issues, eventIssue })
}

const agentComment = { author: 'claude[bot]', body: 'Tamanho definido pelo agente de issues: P' }

test('issue de quem não é colaborador é ignorada', () => {
  assert.deepEqual(select([issue({ authorAssociation: 'NONE' })]).classify, [])
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

test('issue com tamanho P, M ou G nunca é classificada de novo', () => {
  const result = select([issue({ labels: ['Size: P'] }), issue({ labels: ['Size: M'] }), issue({ labels: ['Size: G'] })])
  assert.deepEqual(result.classify, [])
})

test('comentário de classificação do agente impede nova classificação', () => {
  assert.deepEqual(select([issue({ comments: [agentComment] })]).classify, [])
})

test('a mesma marca postada por outra pessoa não impede a classificação', () => {
  const forged = { author: 'estranho', body: 'Tamanho definido pelo agente de issues: M' }
  const target = issue({ comments: [forged] })
  assert.deepEqual(select([target]).classify, [target.number])
})

test('onze issues a classificar viram só as dez mais antigas', () => {
  const issues = Array.from({ length: MAX_CLASSIFY + 1 }, () => issue())
  const result = select([...issues].reverse())
  assert.equal(MAX_CLASSIFY, 10)
  assert.deepEqual(result.classify, issues.map((entry) => entry.number).slice(0, 10))
})

test('evento com issue a classificar devolve só ela', () => {
  const other = issue()
  const target = issue()
  assert.deepEqual(select([other, target], target.number).classify, [target.number])
})

test('evento com issue não elegível não escolhe nada mesmo havendo outras', () => {
  const other = issue()
  const target = issue({ assignees: ['x'] })
  assert.deepEqual(select([other, target], target.number).classify, [])
})

test('o modo size-set nunca devolve pr_issue nem olha pull requests', () => {
  const result = select([issue({ labels: ['Size: P'] }), issue()])
  assert.equal('prIssue' in result, false)
  assert.equal('prAllowed' in result, false)
})

test('nada elegível deixa classify vazio e explica no motivo', () => {
  const result = select([])
  assert.deepEqual(result.classify, [])
  assert.equal(result.reason, 'Nenhuma issue para classificar.')
})

test('o motivo lista as issues a classificar', () => {
  const first = issue()
  const second = issue()
  assert.equal(select([first, second]).reason, `Classificar: ${first.number}, ${second.number}.`)
})
