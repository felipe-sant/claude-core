const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const h = require('./helpers')

const { selectAgent, extractDependencies, MAX_AGENT_PULLS } = require(path.join(h.repoRoot, '.github', 'issue-agent', 'select-issues.js'))

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
    body: '',
    ...overrides
  }
}

function select(issues, extra = {}) {
  return selectAgent({ issues, openPulls: [], branches: [], requested: null, ...extra })
}

const agentComment = { author: 'claude[bot]', body: 'Tamanho definido pelo agente de issues: P' }
const agentPull = { author: 'claude[bot]', body: '' }
const markedPull = { author: 'felipe', body: 'Aberto pelo agente de issues.' }

function pulls(count, pull = agentPull) {
  return Array.from({ length: count }, () => pull)
}

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

test('o limite de pull requests do agente é 5', () => {
  assert.equal(MAX_AGENT_PULLS, 5)
})

test('abaixo do limite, a P mais antiga é tratada mesmo com pull requests do agente abertos', () => {
  const older = issue()
  const newer = issue()
  for (const open of [1, 4]) {
    assert.equal(select([newer, older], { openPulls: pulls(open) }).prIssue, older.number)
  }
})

test('no limite, pr_issue fica vazio e o resumo explica o limite', () => {
  const result = select([issue()], { openPulls: pulls(5) })
  assert.equal(result.prIssue, '')
  assert.equal(result.reason, 'Já há 5 pull requests do agente abertos e o limite é 5: a fila das P espera.')
})

test('acima do limite o resumo mostra a quantidade aberta', () => {
  const result = select([issue()], { openPulls: pulls(6) })
  assert.equal(result.prIssue, '')
  assert.equal(result.reason, 'Já há 6 pull requests do agente abertos e o limite é 5: a fila das P espera.')
})

test('pull requests de outras pessoas, mesmo muitos, não contam para o limite', () => {
  const target = issue()
  const others = pulls(7, { author: 'felipe', body: 'Closes #1' })
  assert.equal(select([target], { openPulls: others }).prIssue, target.number)
})

test('conta como do agente a conta do Claude somada à linha fixa no corpo', () => {
  const result = select([issue()], { openPulls: [...pulls(3), ...pulls(2, markedPull)] })
  assert.equal(result.prIssue, '')
  assert.equal(result.reason, 'Já há 5 pull requests do agente abertos e o limite é 5: a fila das P espera.')
})

test('quatro do agente mais um de outra pessoa ainda deixam tratar a issue', () => {
  const target = issue()
  const openPulls = [...pulls(4), { author: 'felipe', body: '' }]
  assert.equal(select([target], { openPulls }).prIssue, target.number)
})

test('cada execução devolve uma única issue, a mais antiga', () => {
  const older = issue()
  const newer = issue()
  assert.equal(select([newer, older], { openPulls: pulls(2) }).prIssue, older.number)
})

test('issue com pull request ligado continua fora da fila abaixo do limite', () => {
  const closedWithoutMerge = issue({ linkedPullRequests: 1 })
  const result = select([closedWithoutMerge], { openPulls: pulls(1) })
  assert.equal(result.prIssue, '')
  assert.equal(result.reason, 'Nenhuma issue P na fila.')
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

test('com número abaixo do limite, a issue é tratada', () => {
  const target = issue()
  assert.equal(select([target], { requested: String(target.number), openPulls: pulls(4) }).prIssue, target.number)
})

test('com número e no limite, a recusa é a do limite', () => {
  const target = issue()
  const result = select([target], { requested: String(target.number), openPulls: pulls(5) })
  assert.equal(result.prIssue, '')
  assert.equal(result.reason, 'Já há 5 pull requests do agente abertos e o limite é 5: nenhuma issue é tratada agora.')
})

test('número inválido no limite continua recusado como inválido', () => {
  const result = select([issue()], { requested: 'abc', openPulls: pulls(5) })
  assert.equal(result.reason, 'O número informado não é válido: use só dígitos, como 76.')
})

test('abaixo do limite, a issue com branch própria continua recusada com o motivo', () => {
  const target = issue()
  const result = select([target], { requested: String(target.number), openPulls: pulls(1), branches: [`fix/${target.number}-algo`] })
  assert.equal(result.reason, `A issue ${target.number} já tem branch própria.`)
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

function dependent(body, overrides = {}) {
  return issue({ body, ...overrides })
}

test('P que depende de issue aberta fica fora da fila e a seguinte é escolhida', () => {
  const blocker = issue({ labels: [] })
  const waiting = dependent(`Depende de #${blocker.number}`)
  const next = issue()
  assert.equal(select([blocker, waiting, next]).prIssue, next.number)
})

test('P que depende de issue já fechada é tratada normalmente', () => {
  const waiting = dependent('depende de #9999')
  assert.equal(select([waiting]).prIssue, waiting.number)
})

test('a única P que espera dependência aberta deixa a fila vazia', () => {
  const blocker = issue({ labels: [] })
  const waiting = dependent(`depende de #${blocker.number}`)
  const result = select([blocker, waiting])
  assert.equal(result.prIssue, '')
  assert.equal(result.reason, 'Nenhuma issue P na fila.')
})

test('citação de issue sem a expressão depende de não bloqueia', () => {
  const blocker = issue({ labels: [] })
  const related = dependent(`relacionada a #${blocker.number}, ver #${blocker.number}`)
  assert.equal(select([blocker, related]).prIssue, related.number)
})

test('com várias dependências, uma aberta basta para esperar', () => {
  const open = issue({ labels: [] })
  const waiting = dependent(`depende de #9998 e #${open.number}`)
  assert.equal(select([open, waiting]).prIssue, '')
})

test('com várias dependências todas fechadas, a issue é tratada', () => {
  const waiting = dependent('depende de #9997 e #9998')
  assert.equal(select([waiting]).prIssue, waiting.number)
})

test('depende do e depende da, em qualquer caixa, também esperam', () => {
  const blocker = issue({ labels: [] })
  for (const phrase of ['depende do', 'DEPENDE DA', 'Depende De']) {
    const waiting = dependent(`${phrase} #${blocker.number}`)
    assert.equal(select([blocker, waiting]).prIssue, '', phrase)
  }
})

test('número que é de pull request aberto, e não de issue, não bloqueia', () => {
  const waiting = dependent('depende de #9996')
  assert.equal(select([waiting], { openPulls: [] }).prIssue, waiting.number)
})

test('com a issue fechada depois, ela volta à fila', () => {
  const blocker = issue({ labels: [] })
  const waiting = dependent(`depende de #${blocker.number}`)
  assert.equal(select([blocker, waiting]).prIssue, '')
  assert.equal(select([waiting]).prIssue, waiting.number)
})

test('disparo à mão de issue que espera dependência aberta é recusado com o motivo', () => {
  const blocker = issue({ labels: [] })
  const waiting = dependent(`depende de #${blocker.number}`)
  const result = select([blocker, waiting], { requested: String(waiting.number) })
  assert.equal(result.prIssue, '')
  assert.equal(result.reason, `A issue ${waiting.number} depende da issue #${blocker.number}, ainda aberta.`)
})

test('disparo à mão com várias dependências lista só as abertas em ordem crescente', () => {
  const first = issue({ labels: [] })
  const second = issue({ labels: [] })
  const waiting = dependent(`depende de #${second.number}, #9995 e #${first.number}`)
  const result = select([first, second, waiting], { requested: String(waiting.number) })
  assert.equal(result.reason, `A issue ${waiting.number} depende das issues #${first.number}, #${second.number}, ainda abertas.`)
})

test('disparo à mão no limite recusa pelo limite antes da dependência', () => {
  const blocker = issue({ labels: [] })
  const waiting = dependent(`depende de #${blocker.number}`)
  const result = select([blocker, waiting], { requested: String(waiting.number), openPulls: pulls(5) })
  assert.match(result.reason, /limite é 5: nenhuma issue é tratada agora\./)
})

test('disparo à mão de issue sem dependência aberta é tratado', () => {
  const waiting = dependent('depende de #9994')
  assert.equal(select([waiting], { requested: String(waiting.number) }).prIssue, waiting.number)
})

test('extrai os números citados depois de depende de, do e da', () => {
  assert.deepEqual(extractDependencies('Depende de #3 e #4', 1), [3, 4])
  assert.deepEqual(extractDependencies('depende do #5', 1), [5])
  assert.deepEqual(extractDependencies('DEPENDE DA #6', 1), [6])
  assert.deepEqual(extractDependencies('depende de #3, #4 e #7', 1), [3, 4, 7])
})

test('ignora citação sem a expressão, a própria issue e outro repositório', () => {
  assert.deepEqual(extractDependencies('ver #3 e relacionada a #4', 1), [])
  assert.deepEqual(extractDependencies('depende de #1', 1), [])
  assert.deepEqual(extractDependencies('depende de dono/repo#3', 1), [])
  assert.deepEqual(extractDependencies('depende de #3 e dono/repo#4', 1), [3])
})

test('ignora a dependência dentro de bloco de código e de código na linha', () => {
  assert.deepEqual(extractDependencies('```\ndepende de #3\n```', 1), [])
  assert.deepEqual(extractDependencies('veja `depende de #3` aqui', 1), [])
  assert.deepEqual(extractDependencies('```\ndepende de #3\n```\ndepende de #4', 1), [4])
})

test('corpo vazio ou nulo não tem dependência', () => {
  assert.deepEqual(extractDependencies('', 1), [])
  assert.deepEqual(extractDependencies(null, 1), [])
})
