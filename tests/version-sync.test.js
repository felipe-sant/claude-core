const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const h = require('./helpers')

afterEach(h.cleanup)

const copiedPaths = ['bin', 'catalog.json', 'agents', 'rules', 'skills', 'stacks', 'templates', 'profiles', '.claude', '.githooks', 'package.json']
const newVersion = '9.9.9'

function cleanEnv() {
  const env = { ...process.env }
  for (const name of Object.keys(env)) if (name.startsWith('GIT_')) delete env[name]
  return env
}

function git(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', env: cleanEnv() })
  return { status: result.status, output: result.stdout + result.stderr }
}

function makeRepoWithNewVersion() {
  const repo = h.tempDir('versioned')
  for (const rel of copiedPaths) fs.cpSync(path.join(h.repoRoot, rel), path.join(repo, rel), { recursive: true })
  git(repo, 'init', '-q', '-b', 'main')
  git(repo, 'config', 'user.name', 'Teste')
  git(repo, 'config', 'user.email', 'teste@example.com')
  git(repo, 'config', 'commit.gpgsign', 'false')
  git(repo, 'config', 'core.hooksPath', '.githooks')
  git(repo, 'add', '-A')
  git(repo, 'commit', '-q', '--no-verify', '-m', 'base')
  const file = path.join(repo, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'))
  pkg.version = newVersion
  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
  return repo
}

function lockVersions(repo) {
  const lock = JSON.parse(h.read(repo, '.claude/claude-kit.lock.json'))
  return [...new Set(Object.values(lock.files).map((entry) => entry.version))]
}

function generatedFiles(repo) {
  const files = ['.claude/claude-kit.lock.json', '.claude/settings.json']
  for (const folder of ['agents', 'rules', 'skills']) {
    const walk = (dir) => fs.readdirSync(path.join(repo, dir), { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]))
    files.push(...walk(path.join('.claude', folder)))
  }
  return files.sort()
}

test('trocar a versão e rodar o sync:version deixa o registro do .claude com a versão nova', () => {
  const repo = makeRepoWithNewVersion()
  const result = spawnSync('npm', ['run', 'sync:version'], { cwd: repo, encoding: 'utf8', env: cleanEnv() })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(lockVersions(repo), [newVersion])
})

test('o .claude depois do sync:version é igual ao de uma sincronização em pasta vazia', () => {
  const repo = makeRepoWithNewVersion()
  const result = spawnSync('npm', ['run', 'sync:version'], { cwd: repo, encoding: 'utf8', env: cleanEnv() })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const fresh = h.tempDir('fresh')
  const synced = h.run(repo, fresh, '--profile', 'tooling')
  assert.equal(synced.status, 0, synced.output)
  assert.deepEqual(generatedFiles(repo), generatedFiles(fresh))
  for (const rel of generatedFiles(fresh)) {
    assert.equal(h.read(repo, rel), h.read(fresh, rel), `${rel} difere de uma sincronização em pasta vazia`)
  }
})

test('o sync sozinho mantém a versão antiga no registro', () => {
  const repo = makeRepoWithNewVersion()
  const result = spawnSync('npm', ['run', 'sync'], { cwd: repo, encoding: 'utf8', env: cleanEnv() })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.notDeepEqual(lockVersions(repo), [newVersion])
})

test('o commit da versão nova com o .claude regenerado é aceito pelo hook', () => {
  const repo = makeRepoWithNewVersion()
  const synced = spawnSync('npm', ['run', 'sync:version'], { cwd: repo, encoding: 'utf8', env: cleanEnv() })
  assert.equal(synced.status, 0, synced.stdout + synced.stderr)
  git(repo, 'add', '-A')
  const result = git(repo, 'commit', '-m', 'Chore :see_no_evil: Atualiza versão e CHANGELOG')
  assert.equal(result.status, 0, result.output)
})
