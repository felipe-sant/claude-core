const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const h = require('./helpers')

afterEach(h.cleanup)

test('o .claude deste repositório está sincronizado com o perfil tooling', () => {
  const target = h.makeTarget()
  const result = h.run(h.repoRoot, target, '--profile', 'tooling')
  assert.equal(result.status, 0, result.output)

  const expected = JSON.parse(h.read(target, '.claude/claude-kit.lock.json'))
  const lockFile = path.join(h.repoRoot, '.claude', 'claude-kit.lock.json')
  assert.ok(fs.existsSync(lockFile), 'falta o .claude/claude-kit.lock.json: rode npm run sync')
  const actual = JSON.parse(fs.readFileSync(lockFile, 'utf8'))

  assert.deepEqual(Object.keys(actual.files).sort(), Object.keys(expected.files).sort(), 'os arquivos do .claude não batem com o catálogo: rode npm run sync')
  for (const rel of [...Object.keys(expected.files), '.claude/claude-kit.lock.json', '.claude/settings.json']) {
    assert.equal(h.read(h.repoRoot, rel), h.read(target, rel), `${rel} está desatualizado: rode npm run sync`)
  }
})

test('o hook de pre-commit roda o sync e adiciona o .claude ao commit', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(h.repoRoot, 'package.json'), 'utf8'))
  const hook = fs.readFileSync(path.join(h.repoRoot, '.githooks', 'pre-commit'), 'utf8')
  const claude = fs.readFileSync(path.join(h.repoRoot, '.claude', 'CLAUDE.md'), 'utf8')

  assert.equal(pkg.scripts.sync, 'node bin/ai-sync.js . --profile tooling')
  assert.match(pkg.scripts.prepare, /core\.hooksPath \.githooks/)
  assert.match(hook, /npm run sync/)
  assert.match(hook, /git add .*\.claude/)
  assert.ok(fs.statSync(path.join(h.repoRoot, '.githooks', 'pre-commit')).mode & 0o111, 'o hook precisa ser executável')
  assert.match(claude, /npm run sync/)
})

const { spawnSync } = require('node:child_process')

const generatedPaths = ['.claude/agents', '.claude/rules', '.claude/skills', '.claude/settings.json', '.claude/claude-kit.lock.json']
const copiedPaths = ['bin', 'catalog.json', 'agents', 'rules', 'skills', 'stacks', 'templates', 'profiles', '.claude', '.githooks', 'package.json']
const refusalHint = 'npm run sync'

function gitEnv() {
  const env = { ...process.env }
  for (const name of Object.keys(env)) if (name.startsWith('GIT_')) delete env[name]
  return env
}

function git(cwd, ...args) {
  return gitWithEnv(cwd, {}, ...args)
}

function gitWithEnv(cwd, extraEnv, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', env: { ...gitEnv(), ...extraEnv } })
  return { status: result.status, output: result.stdout + result.stderr, stdout: result.stdout }
}

function makeHookedRepo() {
  const repo = h.tempDir('hooked')
  for (const rel of copiedPaths) fs.cpSync(path.join(h.repoRoot, rel), path.join(repo, rel), { recursive: true })
  git(repo, 'init', '-q', '-b', 'main')
  git(repo, 'config', 'user.name', 'Teste')
  git(repo, 'config', 'user.email', 'teste@example.com')
  git(repo, 'config', 'commit.gpgsign', 'false')
  git(repo, 'config', 'core.hooksPath', '.githooks')
  git(repo, 'add', '-A')
  git(repo, 'commit', '-q', '--no-verify', '-m', 'base')
  return repo
}

function appendLine(repo, rel, line = 'linha nova') {
  fs.appendFileSync(path.join(repo, rel), `\n${line}\n`)
}

function headIsInSync(repo) {
  const exported = h.tempDir('head')
  const archive = spawnSync('sh', ['-c', `git archive HEAD | tar -x -C "${exported}"`], { cwd: repo, env: gitEnv() })
  assert.equal(archive.status, 0)
  const fresh = h.tempDir('fresh')
  const synced = h.run(exported, fresh, '--profile', 'tooling')
  assert.equal(synced.status, 0, synced.output)
  return generatedPaths.every((rel) => {
    const left = path.join(exported, rel)
    const right = path.join(fresh, rel)
    if (!fs.existsSync(left) || !fs.existsSync(right)) return fs.existsSync(left) === fs.existsSync(right)
    return fs.statSync(left).isDirectory() ? h.snapshot(left) === h.snapshot(right) : fs.readFileSync(left, 'utf8') === fs.readFileSync(right, 'utf8')
  })
}

function committedFiles(repo) {
  return git(repo, 'show', '--name-only', '--format=', 'HEAD').stdout.split('\n').filter(Boolean)
}

function stageSnapshot(repo) {
  return `${git(repo, 'diff', '--cached', '--name-status').stdout}\n${git(repo, 'ls-files', '-s').stdout}`
}

function commitWithScratch(repo, ...args) {
  const scratch = h.tempDir('scratch')
  const result = gitWithEnv(repo, { TMPDIR: scratch, NODE_DISABLE_COMPILE_CACHE: '1' }, 'commit', ...args)
  return { result, scratch }
}

function head(repo) {
  return git(repo, 'rev-parse', 'HEAD').stdout.trim()
}

test('commit por caminho só da fonte alterada é recusado e nada é commitado', () => {
  const repo = makeHookedRepo()
  const before = head(repo)
  appendLine(repo, 'rules/commit-standard.md')
  const result = git(repo, 'commit', '-m', 'Altera regra', '--', 'rules/commit-standard.md')
  assert.notEqual(result.status, 0, result.output)
  assert.match(result.output, new RegExp(refusalHint))
  assert.match(result.output, /\.claude\/rules\/commit-standard\.md/)
  assert.equal(head(repo), before)
})

test('commit por caminho da fonte com os gerados atualizados passa e fica em sincronia', () => {
  const repo = makeHookedRepo()
  appendLine(repo, 'rules/commit-standard.md')
  const synced = spawnSync('npm', ['run', 'sync'], { cwd: repo, encoding: 'utf8', env: gitEnv() })
  assert.equal(synced.status, 0, synced.stderr)
  const result = git(repo, 'commit', '-m', 'Altera regra', '--', 'rules/commit-standard.md', '.claude/rules/commit-standard.md', '.claude/claude-kit.lock.json')
  assert.equal(result.status, 0, result.output)
  assert.ok(headIsInSync(repo))
})

test('commit sem caminhos com a fonte no stage passa, leva os gerados e fica em sincronia', () => {
  const repo = makeHookedRepo()
  appendLine(repo, 'rules/commit-standard.md')
  git(repo, 'add', 'rules/commit-standard.md')
  const result = git(repo, 'commit', '-m', 'Altera regra')
  assert.equal(result.status, 0, result.output)
  assert.ok(committedFiles(repo).includes('.claude/claude-kit.lock.json'))
  assert.ok(headIsInSync(repo))
})

test('commit sem caminhos com fonte de outro agente fora do stage é recusado sem mexer no stage', () => {
  const repo = makeHookedRepo()
  const before = head(repo)
  appendLine(repo, 'rules/commit-standard.md')
  appendLine(repo, 'rules/git-standard.md')
  git(repo, 'add', 'rules/commit-standard.md')
  const stagedBefore = stageSnapshot(repo)
  const result = git(repo, 'commit', '-m', 'Altera regra')
  assert.notEqual(result.status, 0, result.output)
  assert.match(result.output, new RegExp(refusalHint))
  assert.equal(head(repo), before)
  assert.equal(stageSnapshot(repo), stagedBefore)
})

test('commit por caminho de uma fonte com outra fonte alterada por outro agente é recusado', () => {
  const repo = makeHookedRepo()
  const before = head(repo)
  appendLine(repo, 'rules/commit-standard.md')
  appendLine(repo, 'rules/git-standard.md')
  const refused = git(repo, 'commit', '-m', 'Altera regra', '--', 'rules/commit-standard.md')
  assert.notEqual(refused.status, 0, refused.output)
  assert.match(refused.output, /outro agente/)
  assert.equal(head(repo), before)
  const withGenerated = git(repo, 'commit', '-m', 'Altera regra', '--', 'rules/commit-standard.md', '.claude/rules/commit-standard.md', '.claude/rules/git-standard.md', '.claude/claude-kit.lock.json')
  assert.notEqual(withGenerated.status, 0, withGenerated.output)
  assert.equal(head(repo), before)
})

test('commit por caminho só da especificação não leva nada do .claude nem é recusado', () => {
  const repo = makeHookedRepo()
  appendLine(repo, 'rules/commit-standard.md')
  appendLine(repo, 'rules/git-standard.md')
  h.write(path.join(repo, '.specs/tarefa.md'), 'especificação\n')
  git(repo, 'add', '.specs/tarefa.md')
  const result = git(repo, 'commit', '-m', 'Docs', '--', '.specs/tarefa.md')
  assert.equal(result.status, 0, result.output)
  assert.deepEqual(committedFiles(repo), ['.specs/tarefa.md'])
  const staged = git(repo, 'diff', '--cached', '--name-only').stdout
  assert.equal(staged, '')
})

test('o último commit fora de sincronia faz recusar até o commit que não toca fonte', () => {
  const repo = makeHookedRepo()
  appendLine(repo, 'rules/commit-standard.md')
  git(repo, 'add', 'rules/commit-standard.md')
  git(repo, 'commit', '-q', '--no-verify', '-m', 'Fonte sem gerados')
  h.write(path.join(repo, '.specs/tarefa.md'), 'especificação\n')
  git(repo, 'add', '.specs/tarefa.md')
  const result = git(repo, 'commit', '-m', 'Docs', '--', '.specs/tarefa.md')
  assert.notEqual(result.status, 0, result.output)
  assert.match(result.output, /o último commit está fora de sincronia/)
  assert.match(result.output, new RegExp(refusalHint))
})

test('em worktree vinculada o commit por caminho da fonte é recusado e o da especificação passa', () => {
  const repo = makeHookedRepo()
  const linked = path.join(h.tempDir('linked'), 'trabalho')
  assert.equal(git(repo, 'worktree', 'add', '-q', '-b', 'tarefa', linked).status, 0)
  appendLine(linked, 'rules/commit-standard.md')
  const before = head(linked)
  const refused = git(linked, 'commit', '-m', 'Altera regra', '--', 'rules/commit-standard.md')
  assert.notEqual(refused.status, 0, refused.output)
  assert.equal(head(linked), before)
  h.write(path.join(linked, '.specs/tarefa.md'), 'especificação\n')
  git(linked, 'add', '.specs/tarefa.md')
  const accepted = git(linked, 'commit', '-m', 'Docs', '--', '.specs/tarefa.md')
  assert.equal(accepted.status, 0, accepted.output)
  assert.deepEqual(committedFiles(linked), ['.specs/tarefa.md'])
})

test('commits recusados e aceitos não deixam pastas temporárias para trás', () => {
  const repo = makeHookedRepo()
  appendLine(repo, 'rules/commit-standard.md')
  const refused = commitWithScratch(repo, '-m', 'Altera regra', '--', 'rules/commit-standard.md')
  assert.notEqual(refused.result.status, 0, refused.result.output)
  assert.deepEqual(fs.readdirSync(refused.scratch), [])
  h.write(path.join(repo, '.specs/tarefa.md'), 'especificação\n')
  git(repo, 'add', '.specs/tarefa.md')
  git(repo, 'restore', '--source=HEAD', '--worktree', '--staged', 'rules/commit-standard.md')
  const accepted = commitWithScratch(repo, '-m', 'Docs', '--', '.specs/tarefa.md')
  assert.equal(accepted.result.status, 0, accepted.result.output)
  assert.deepEqual(fs.readdirSync(accepted.scratch), [])
})

function assertSyncFailureRefused(repo, before, stageBefore, { result, scratch }, hint) {
  assert.notEqual(result.status, 0, result.output)
  assert.match(result.output, /o sync falhou/)
  assert.match(result.output, /catalog\.json/)
  assert.doesNotMatch(result.output, /SyntaxError/)
  if (hint) assert.match(result.output, hint)
  assert.equal(head(repo), before)
  assert.equal(stageSnapshot(repo), stageBefore)
  assert.deepEqual(fs.readdirSync(scratch), [])
}

test('sync falhando na pasta recusa o commit por caminho com mensagem em português', () => {
  const repo = makeHookedRepo()
  fs.writeFileSync(path.join(repo, 'catalog.json'), '{ quebrado')
  h.write(path.join(repo, '.specs/tarefa.md'), 'especificação\n')
  git(repo, 'add', '.specs/tarefa.md')
  const before = head(repo)
  const stageBefore = stageSnapshot(repo)
  assertSyncFailureRefused(repo, before, stageBefore, commitWithScratch(repo, '-m', 'Docs', '--', '.specs/tarefa.md'), /npm run sync/)
})

test('sync falhando na pasta recusa o commit sem caminhos com mensagem em português', () => {
  const repo = makeHookedRepo()
  fs.writeFileSync(path.join(repo, 'catalog.json'), '{ quebrado')
  git(repo, 'add', 'catalog.json')
  const before = head(repo)
  const stageBefore = stageSnapshot(repo)
  assertSyncFailureRefused(repo, before, stageBefore, commitWithScratch(repo, '-m', 'Quebra catálogo'), /npm run sync/)
})

test('sync falhando só no stage recusa o commit sem caminhos com mensagem em português', () => {
  const repo = makeHookedRepo()
  const validCatalog = fs.readFileSync(path.join(repo, 'catalog.json'), 'utf8')
  fs.writeFileSync(path.join(repo, 'catalog.json'), '{ quebrado')
  git(repo, 'add', 'catalog.json')
  fs.writeFileSync(path.join(repo, 'catalog.json'), validCatalog)
  const before = head(repo)
  const stageBefore = stageSnapshot(repo)
  assertSyncFailureRefused(repo, before, stageBefore, commitWithScratch(repo, '-m', 'Quebra catálogo'), /o que está preparado/)
})

test('catálogo inválido no último commit recusa o commit por caminho da especificação mandando conferir o último commit', () => {
  const repo = makeHookedRepo()
  const validCatalog = fs.readFileSync(path.join(repo, 'catalog.json'), 'utf8')
  fs.writeFileSync(path.join(repo, 'catalog.json'), '{ quebrado')
  git(repo, 'add', 'catalog.json')
  git(repo, 'commit', '-q', '--no-verify', '-m', 'Catálogo quebrado')
  fs.writeFileSync(path.join(repo, 'catalog.json'), validCatalog)
  h.write(path.join(repo, '.specs/tarefa.md'), 'especificação\n')
  git(repo, 'add', '.specs/tarefa.md')
  const before = head(repo)
  const stageBefore = stageSnapshot(repo)
  assertSyncFailureRefused(repo, before, stageBefore, commitWithScratch(repo, '-m', 'Docs', '--', '.specs/tarefa.md'), /o último commit/)
})
