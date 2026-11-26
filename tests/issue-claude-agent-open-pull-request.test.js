const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const h = require('./helpers')

const scriptPath = path.join(h.repoRoot, '.github', 'issue-agent', 'open-pull-request.js')
const { findIssueBranch, validateDescription, buildBody, buildTitle, checkSize } = require(scriptPath)

const validDescription = [
  '## O que muda',
  'Texto do que muda.',
  '',
  '## Como foi verificado',
  'Rodei tudo.',
  '',
  '## Observações',
  'Nada de especial.'
].join('\n')

test('monta o corpo com o vínculo ao fim de O que muda e a linha fixa ao fim', () => {
  const body = buildBody(validDescription, 95)
  assert.equal(
    body,
    [
      '## O que muda',
      'Texto do que muda.',
      '',
      'Closes #95',
      '',
      '## Como foi verificado',
      'Rodei tudo.',
      '',
      '## Observações',
      'Nada de especial.',
      '',
      'Aberto pelo agente de issues.'
    ].join('\n')
  )
})

test('monta o título com tipo e ícone da branch, número e título da issue', () => {
  assert.equal(buildTitle('fix/95-algo', 95, 'Agente não abre'), 'Fix :bug: [#95] Agente não abre')
  assert.equal(buildTitle('feat/7-algo', 7, 'Nova coisa'), 'Feat :sparkles: [#7] Nova coisa')
  assert.equal(buildTitle('chore/3-algo', 3, 'Limpa'), 'Chore :see_no_evil: [#3] Limpa')
})

test('acha a única branch nova da issue', () => {
  assert.deepEqual(findIssueBranch(['main', 'fix/95-algo', 'feat/12-outra'], [], 95), { branch: 'fix/95-algo', count: 1 })
})

test('sem branch da issue devolve contagem zero', () => {
  assert.deepEqual(findIssueBranch(['main', 'feat/12-outra'], [], 95), { branch: '', count: 0 })
})

test('com duas branches da issue devolve contagem dois', () => {
  assert.equal(findIssueBranch(['fix/95-a', 'feat/95-b'], [], 95).count, 2)
})

test('não confunde o número da issue com prefixo de outro número', () => {
  assert.equal(findIssueBranch(['fix/950-algo'], [], 95).count, 0)
  assert.equal(findIssueBranch(['fix/9-algo'], [], 95).count, 0)
})

test('ignora branch que já existia antes da execução', () => {
  assert.equal(findIssueBranch(['fix/95-algo'], ['fix/95-algo'], 95).count, 0)
})

test('ignora branch com tipo fora da tabela', () => {
  assert.equal(findIssueBranch(['agente/95-algo'], [], 95).count, 0)
})

test('aceita a descrição com as três seções na ordem', () => {
  assert.equal(validateDescription(validDescription), '')
})

test('recusa descrição vazia', () => {
  assert.notEqual(validateDescription(''), '')
  assert.notEqual(validateDescription('   \n'), '')
})

test('recusa descrição com seções fora de ordem', () => {
  const swapped = ['## Como foi verificado', 'a', '## O que muda', 'b', '## Observações', 'c'].join('\n')
  assert.notEqual(validateDescription(swapped), '')
})

test('recusa descrição sem uma das seções', () => {
  assert.notEqual(validateDescription('## O que muda\na\n\n## Observações\nc'), '')
})

test('recusa vínculo que fecha issue, sem diferenciar maiúsculas', () => {
  for (const word of ['Closes', 'closes', 'FIXES', 'resolves', 'Close', 'Fixed', 'resolved']) {
    assert.notEqual(validateDescription(`${validDescription}\n${word} #12`), '', word)
  }
})

test('aceita menção a issue sem palavra de fechamento', () => {
  assert.equal(validateDescription(`${validDescription}\nVeja a issue #12.`), '')
})

test('aceita só a issue Size: P', () => {
  assert.equal(checkSize(['Size: P', 'bug']), '')
  assert.notEqual(checkSize(['Size: M']), '')
  assert.notEqual(checkSize(['bug']), '')
})

test('recusa vínculo que fecha issue por URL completa ou por repositório', () => {
  for (const link of [
    'Closes https://github.com/felipe-sant/claude-kit/issues/12',
    'fixes HTTPS://GITHUB.COM/a/b/issues/3',
    'closes felipe-sant/claude-kit#12'
  ]) {
    assert.notEqual(validateDescription(`${validDescription}\n${link}`), '', link)
  }
})

test('aceita GH-n depois de palavra de fechamento, que o GitHub não usa para fechar issue', () => {
  assert.equal(validateDescription(`${validDescription}\nresolves GH-3`), '')
})

const { createPullRequest } = require(scriptPath)

const originalFetch = globalThis.fetch

async function failWith(status, payload) {
  globalThis.fetch = async () => ({ ok: false, status, json: async () => payload })
  try {
    await createPullRequest('token-secreto', 'https://api.github.com/repos/o/r/pulls', { title: 'x' })
    return null
  } catch (error) {
    return error.message
  } finally {
    globalThis.fetch = originalFetch
  }
}

test('no 403 mostra o status, a mensagem da API e a dica da opção do repositório', async () => {
  const message = await failWith(403, { message: 'GitHub Actions is not permitted to create or approve pull requests.' })
  assert.match(message, /403/)
  assert.match(message, /GitHub Actions is not permitted to create or approve pull requests\./)
  assert.match(message, /Allow GitHub Actions to create and approve pull requests/)
  assert.match(message, /Settings > Actions > General > Workflow permissions/)
  assert.doesNotMatch(message, /token-secreto/)
})

test('em outro status mostra o status e a mensagem da API sem a dica', async () => {
  const message = await failWith(422, { message: 'Validation Failed' })
  assert.match(message, /422/)
  assert.match(message, /Validation Failed/)
  assert.doesNotMatch(message, /Allow GitHub Actions/)
})

test('quando a resposta de erro não é JSON mantém o status', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => { throw new SyntaxError('x') } })
  try {
    await assert.rejects(createPullRequest('t', 'https://api.github.com/x', {}), /500/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('devolve a resposta quando a API cria o pull request', async () => {
  globalThis.fetch = async () => ({ ok: true, status: 201, json: async () => ({ html_url: 'https://github.com/o/r/pull/1' }) })
  try {
    assert.deepEqual(await createPullRequest('t', 'https://api.github.com/x', {}), { html_url: 'https://github.com/o/r/pull/1' })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('grava a saída do passo em linhas chave=valor, sem quebra de linha no valor', () => {
  const fs = require('node:fs')
  const os = require('node:os')
  const { recordOutputs } = require(scriptPath)
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'saida-')), 'output')
  recordOutputs(file, { pull_request_url: 'https://github.com/o/r/pull/3', failure_reason: 'linha um\nlinha dois' })
  assert.equal(fs.readFileSync(file, 'utf8'), 'pull_request_url=https://github.com/o/r/pull/3\nfailure_reason=linha um linha dois\n')
  fs.rmSync(path.dirname(file), { recursive: true })
})

test('sem arquivo de saída do passo não grava nada e não falha', () => {
  const { recordOutputs } = require(scriptPath)
  assert.doesNotThrow(() => recordOutputs('', { failure_reason: 'x' }))
  assert.doesNotThrow(() => recordOutputs(undefined, { failure_reason: 'x' }))
})

test('branch sem nota de mudança não abre pull request', () => {
  const { checkChangesetNote } = require(scriptPath)
  const problem = checkChangesetNote([{ filename: 'README.md', status: 'modified' }], 'fix/95-algo')
  assert.equal(problem, 'A branch fix/95-algo não traz a nota de mudança.')
})

test('aceita branch com nota de mudança adicionada, inclusive a vazia', () => {
  const { checkChangesetNote } = require(scriptPath)
  assert.equal(checkChangesetNote([{ filename: '.changeset/corrige-algo.md', status: 'added' }], 'fix/95-algo'), '')
  assert.equal(checkChangesetNote([{ filename: 'a.js', status: 'modified' }, { filename: '.changeset/vazia.md', status: 'added' }], 'fix/95-algo'), '')
})

test('o README da pasta de notas sozinho não conta como nota', () => {
  const { checkChangesetNote } = require(scriptPath)
  assert.notEqual(checkChangesetNote([{ filename: '.changeset/README.md', status: 'added' }], 'fix/95-algo'), '')
})

test('nota fora da pasta de notas, em subpasta, de outro tipo ou só modificada não conta', () => {
  const { checkChangesetNote } = require(scriptPath)
  for (const file of [
    { filename: 'docs/nota.md', status: 'added' },
    { filename: '.changeset/sub/nota.md', status: 'added' },
    { filename: '.changeset/config.json', status: 'added' },
    { filename: '.changeset/antiga.md', status: 'modified' },
    { filename: '.changeset/removida.md', status: 'removed' }
  ]) {
    assert.notEqual(checkChangesetNote([file], 'fix/95-algo'), '', file.filename)
  }
})

async function runMainWithBranchFiles(files) {
  const fs = require('node:fs')
  const os = require('node:os')
  const { main } = require(scriptPath)
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'abertura-'))
  fs.writeFileSync(path.join(dir, 'branches-95'), 'main\n')
  fs.writeFileSync(path.join(dir, 'pull-request-body.md'), validDescription)
  const saved = { argv: process.argv, token: process.env.GITHUB_TOKEN, repository: process.env.GITHUB_REPOSITORY, check: process.env.CHECK_DIR, output: process.env.GITHUB_OUTPUT }
  process.argv = ['node', 'open-pull-request.js', dir, '95']
  process.env.GITHUB_TOKEN = 'token'
  process.env.GITHUB_REPOSITORY = 'dono/repo'
  process.env.CHECK_DIR = dir
  delete process.env.GITHUB_OUTPUT
  const calls = []
  const answers = {
    '/branches?': [{ name: 'main' }, { name: 'fix/95-algo' }],
    '/issues/95': { title: 'Algo', labels: [{ name: 'Size: P' }] },
    '/compare/': { ahead_by: 1, files },
    '/pulls?state=open': [],
    '/repos/dono/repo': { default_branch: 'main' }
  }
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, method: options.method || 'GET' })
    if (options.method === 'POST') return { ok: true, status: 201, json: async () => ({ html_url: 'https://github.com/dono/repo/pull/1' }) }
    const key = Object.keys(answers).find((part) => url.includes(part))
    return { ok: true, status: 200, json: async () => answers[key] }
  }
  try {
    const outcome = await main().then(() => null, (error) => error)
    return { outcome, calls }
  } finally {
    globalThis.fetch = originalFetch
    process.argv = saved.argv
    for (const [name, value] of [['GITHUB_TOKEN', saved.token], ['GITHUB_REPOSITORY', saved.repository], ['CHECK_DIR', saved.check], ['GITHUB_OUTPUT', saved.output]]) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
    fs.rmSync(dir, { recursive: true })
  }
}

test('no fluxo principal, branch sem nota de mudança não cria pull request', async () => {
  const { outcome, calls } = await runMainWithBranchFiles([{ filename: 'README.md', status: 'modified' }])
  assert.match(outcome.message, /A branch fix\/95-algo não traz a nota de mudança\./)
  assert.equal(calls.some((call) => call.method === 'POST'), false)
})

test('no fluxo principal, branch com nota de mudança cria o pull request', async () => {
  const { outcome, calls } = await runMainWithBranchFiles([{ filename: '.changeset/algo.md', status: 'added' }])
  assert.equal(outcome, null)
  assert.equal(calls.filter((call) => call.method === 'POST').length, 1)
})
