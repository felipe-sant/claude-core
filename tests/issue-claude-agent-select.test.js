const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const h = require('./helpers')

const { selectAgent } = require(path.join(h.repoRoot, '.github', 'issue-agent', 'select-issues.js'))

let counter = 0
function issue(overrides = {}) {
  counter += 1
  return {
    number: counter,
    createdAt: `2026-01-${String(counter).padStart(2, '0')}T00:00:00Z`,
    isPullRequest: false,
    authorAssociation: 'OWNER',
    assignees: [],
    labels: ['Size: P'],
    linkedPullRequests: 0,
    comments: [],
    ...overrides
  }
}

function select(issues, extra = {}) {
  return selectAgent({ issues, openPulls: [], branches: [], requested: null, ...extra })
}

const agentComment = { author: 'claude[bot]', body: 'Tamanho definido pelo agente de issues: P' }
const agentPull = { author: 'claude[bot]', body: '' }

test('P sem pull request, branch e responsável vira pr_issue', () => {
  const target = issue()
  const result = select([target])
  assert.equal(result.prIssue, target.number)
  assert.equal(result.reason, `Pull request da issue ${target.number}.`)
})

test('P com comentário de classificação do agente continua na fila', () => {
  const target = issue({ comments: [agentComment] })
  assert.equal(select([target]).prIssue, target.number)
})

test('P que também tem M ou G nunca entra na fila', () => {
  assert.equal(select([issue({ labels: ['Size: P', 'Size: M'] }), issue({ labels: ['Size: G', 'Size: P'] })]).prIssue, '')
})

test('issue sem tamanho P nunca entra na fila', () => {
  assert.equal(select([issue({ labels: [] }), issue({ labels: ['Size: M'] })]).prIssue, '')
})

test('P com branch própria é ignorada', () => {
  const target = issue()
  assert.equal(select([target], { branches: [`feat/${target.number}-algo`] }).prIssue, '')
})

test('branch de outro número não tira a P da fila', () => {
  const target = issue()
  assert.equal(select([target], { branches: [`feat/${target.number}0-algo`, 'main'] }).prIssue, target.number)
})

test('P com responsável ou pull request ligado é ignorada', () => {
  assert.equal(select([issue({ assignees: ['x'] }), issue({ linkedPullRequests: 1 })]).prIssue, '')
})

test('a única P de quem não é colaborador não vira pr_issue', () => {
  assert.equal(select([issue({ authorAssociation: 'NONE' })]).prIssue, '')
})

test('pull request na lista de issues é ignorado', () => {
  assert.equal(select([issue({ isPullRequest: true })]).prIssue, '')
})

test('duas P na fila escolhem a mais antiga', () => {
  const older = issue({ createdAt: '2025-01-01T00:00:00Z' })
  const newer = issue()
  assert.equal(select([newer, older]).prIssue, older.number)
})

test('pull request do agente aberto deixa pr_issue vazio e a fila espera', () => {
  const result = select([issue()], { openPulls: [agentPull] })
  assert.equal(result.prIssue, '')
  assert.equal(result.reason, 'Já há um pull request do agente aberto: a fila das P espera.')
})

test('pull request com a linha fixa no corpo conta como do agente', () => {
  const result = select([issue()], { openPulls: [{ author: 'felipe', body: 'Aberto pelo agente de issues.' }] })
  assert.equal(result.prIssue, '')
})

test('pull request de outra pessoa não bloqueia', () => {
  const target = issue()
  assert.equal(select([target], { openPulls: [{ author: 'felipe', body: 'Closes #1' }] }).prIssue, target.number)
})

test('sem P na fila o motivo diz que a fila está vazia', () => {
  assert.equal(select([]).reason, 'Nenhuma issue P na fila.')
})

test('o modo agent não recebe nem olha o evento issues', () => {
  const older = issue()
  const newer = issue()
  assert.equal(select([older, newer], { eventIssue: newer.number }).prIssue, older.number)
})

test('número informado escolhe só essa issue, mesmo havendo P mais antiga', () => {
  const older = issue()
  const target = issue()
  assert.equal(select([older, target], { requested: String(target.number) }).prIssue, target.number)
})

test('número com espaços nas pontas é aceito', () => {
  const target = issue()
  assert.equal(select([target], { requested: `  ${target.number} ` }).prIssue, target.number)
})

test('número só com espaços conta como campo vazio', () => {
  const older = issue()
  assert.equal(select([older, issue()], { requested: '   ' }).prIssue, older.number)
})

for (const invalid of ['abc', '0', '-1', '76a', '1 2', '07', '1.5']) {
  test(`o número "${invalid}" é recusado como inválido`, () => {
    const result = select([issue()], { requested: invalid })
    assert.equal(result.prIssue, '')
    assert.equal(result.reason, 'O número informado não é válido: use só dígitos, como 76.')
  })
}

test('com número e pull request do agente aberto, a recusa é a do pull request', () => {
  const target = issue()
  const result = select([target], { requested: String(target.number), openPulls: [agentPull] })
  assert.equal(result.prIssue, '')
  assert.equal(result.reason, 'Já há um pull request do agente aberto: nenhuma issue é tratada agora.')
})

test('número de issue que não está entre as abertas é recusado', () => {
  const result = select([issue()], { requested: '9999' })
  assert.equal(result.reason, 'A issue 9999 não foi encontrada entre as issues abertas: ela não existe, está fechada ou é um pull request.')
})

test('número de pull request na lista é recusado como não encontrado', () => {
  const pull = issue({ isPullRequest: true })
  assert.match(select([pull], { requested: String(pull.number) }).reason, /não foi encontrada entre as issues abertas/)
})

const refusals = [
  ['aberta por quem não é colaborador', { authorAssociation: 'NONE' }, 'não foi aberta por dono, membro ou colaborador do repositório.'],
  ['com responsável', { assignees: ['x'] }, 'tem responsável.'],
  ['com pull request ligado', { linkedPullRequests: 1 }, 'já tem pull request ligado.'],
  ['com tamanho M', { labels: ['Size: M'] }, 'tem o tamanho Size: M ou Size: G.'],
  ['com tamanho G', { labels: ['Size: G'] }, 'tem o tamanho Size: M ou Size: G.'],
  ['sem tamanho P', { labels: [] }, 'não tem o tamanho Size: P.']
]

for (const [name, overrides, ending] of refusals) {
  test(`número de issue ${name} é recusado com o motivo`, () => {
    const target = issue(overrides)
    const result = select([target], { requested: String(target.number) })
    assert.equal(result.prIssue, '')
    assert.equal(result.reason, `A issue ${target.number} ${ending}`)
  })
}

test('número de issue com branch própria é recusado com o motivo', () => {
  const target = issue()
  const result = select([target], { requested: String(target.number), branches: [`fix/${target.number}-algo`] })
  assert.equal(result.prIssue, '')
  assert.equal(result.reason, `A issue ${target.number} já tem branch própria.`)
})
