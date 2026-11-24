const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const h = require('./helpers')

afterEach(h.cleanup)

const scriptPath = path.join(h.repoRoot, '.github', 'issue-agent', 'issue-context.js')
const { buildContext, writeContexts } = require(scriptPath)

const issue = { number: 7, title: 'Titulo', body: 'Corpo', labels: [{ name: 'enhancement' }] }

function comment(association, body = association) {
  return { user: { login: `user-${association}` }, author_association: association, body }
}

test('comentário de NONE fica de fora', () => {
  const context = buildContext(issue, [comment('NONE'), comment('OWNER')])
  assert.deepEqual(context.comments.map((entry) => entry.association), ['OWNER'])
})

test('contribuidor e primeiro contribuidor ficam de fora', () => {
  const context = buildContext(issue, [comment('CONTRIBUTOR'), comment('FIRST_TIMER'), comment('FIRST_TIME_CONTRIBUTOR')])
  assert.deepEqual(context.comments, [])
})

test('dono, membro e colaborador entram na ordem original', () => {
  const context = buildContext(issue, [comment('COLLABORATOR', 'a'), comment('NONE', 'b'), comment('OWNER', 'c'), comment('MEMBER', 'd')])
  assert.deepEqual(context.comments.map((entry) => entry.body), ['a', 'c', 'd'])
})

test('issue sem comentários gera lista vazia', () => {
  assert.deepEqual(buildContext(issue, []).comments, [])
})

test('o objeto segue o formato do contrato', () => {
  const context = buildContext(issue, [comment('OWNER', 'oi')])
  assert.deepEqual(context, {
    number: 7,
    title: 'Titulo',
    body: 'Corpo',
    labels: ['enhancement'],
    comments: [{ author: 'user-OWNER', association: 'OWNER', body: 'oi' }]
  })
})

test('corpo vazio vira texto vazio', () => {
  assert.equal(buildContext({ ...issue, body: null }, []).body, '')
})

test('writeContexts grava um arquivo por issue na pasta', () => {
  const dir = path.join(h.tempDir('context'), 'nova')
  writeContexts(dir, [buildContext(issue, [])])
  const saved = JSON.parse(fs.readFileSync(path.join(dir, 'issue-7.json'), 'utf8'))
  assert.equal(saved.number, 7)
})

test('sem GITHUB_TOKEN o script sai com erro em português', () => {
  const result = spawnSync('node', [scriptPath, h.tempDir('context'), '7'], { encoding: 'utf8', env: { PATH: process.env.PATH } })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /GITHUB_TOKEN/)
})

test('sem a pasta e os números o script sai com erro em português', () => {
  const result = spawnSync('node', [scriptPath], { encoding: 'utf8', env: { PATH: process.env.PATH, GITHUB_TOKEN: 'x', GITHUB_REPOSITORY: 'a/b' } })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /pasta/)
})
