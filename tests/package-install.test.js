const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const h = require('./helpers')

const forbiddenPrefixes = ['tests/', 'lint/', '.github/', '.specs/', '.claude/', '.changeset/', 'scripts/', '.githooks/']
const catalog = JSON.parse(fs.readFileSync(path.join(h.repoRoot, 'catalog.json'), 'utf8'))
const catalogPaths = ['agents', 'rules', 'skills', 'settings'].flatMap((group) => Object.values(catalog[group]).map((item) => item.path))
const userRule = 'Regra própria do usuário\n'

let tarball
let packed
let installed
let result
let userRuleFile

function cleanEnv() {
  const env = { ...process.env }
  for (const name of Object.keys(env)) if (name.startsWith('npm_') || name.startsWith('GIT_')) delete env[name]
  return env
}

function npm(cwd, ...args) {
  const run = spawnSync('npm', args, { cwd, encoding: 'utf8', env: cleanEnv() })
  return { status: run.status, output: run.stdout + run.stderr, stdout: run.stdout }
}

before(() => {
  const packDir = h.tempDir('pack')
  const packResult = npm(h.repoRoot, 'pack', '--json', '--ignore-scripts', '--pack-destination', packDir)
  assert.equal(packResult.status, 0, packResult.output)
  packed = JSON.parse(packResult.stdout)[0]
  tarball = path.join(packDir, packed.filename)

  installed = h.tempDir('consumer')
  fs.writeFileSync(path.join(installed, 'package.json'), JSON.stringify({ name: 'consumidor', version: '1.0.0', private: true }))
  const install = npm(installed, 'install', tarball, '--offline', '--no-audit', '--no-fund', '--ignore-scripts')
  assert.equal(install.status, 0, install.output)

  userRuleFile = path.join(installed, '.claude', 'rules', 'commit-standard.md')
  fs.mkdirSync(path.dirname(userRuleFile), { recursive: true })
  fs.writeFileSync(userRuleFile, userRule)
  result = spawnSync('npx', ['--no-install', 'ai-sync'], { cwd: installed, encoding: 'utf8', env: cleanEnv() })
})

after(h.cleanup)

test('o pacote lista o comando, o catálogo, todo caminho do catálogo e os perfis', () => {
  const files = packed.files.map((file) => file.path)
  assert.ok(files.includes('bin/ai-sync.js'))
  assert.ok(files.includes('catalog.json'))
  assert.ok(files.includes('LICENSE'))
  for (const itemPath of catalogPaths) {
    assert.ok(files.some((file) => file === itemPath || file.startsWith(`${itemPath}/`)), `falta ${itemPath}`)
  }
  for (const profile of fs.readdirSync(path.join(h.repoRoot, 'profiles'))) {
    assert.ok(files.includes(`profiles/${profile}`), `falta profiles/${profile}`)
  }
})

test('o pacote não leva testes, lint, automações nem especificações', () => {
  const files = packed.files.map((file) => file.path)
  for (const file of files) {
    for (const prefix of forbiddenPrefixes) assert.ok(!file.startsWith(prefix), `não deveria levar ${file}`)
  }
  assert.ok(!files.includes('package-lock.json'))
})

test('o npx ai-sync no repositório que instalou o pacote monta o time e sai com código 0', () => {
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.ok(h.exists(installed, '.claude/agents/product-owner.md'))
  const lock = JSON.parse(h.read(installed, '.claude/claude-kit.lock.json'))
  const version = JSON.parse(fs.readFileSync(path.join(h.repoRoot, 'package.json'), 'utf8')).version
  const versions = new Set(Object.values(lock.files).map((entry) => entry.version))
  assert.deepEqual([...versions], [version])
})

test('o arquivo do usuário no caminho de uma regra do catálogo fica intacto e há aviso de conflito', () => {
  assert.equal(fs.readFileSync(userRuleFile, 'utf8'), userRule)
  assert.match(result.stdout + result.stderr, /commit-standard\.md/)
})

test('o npx ai-sync --check passa no pacote instalado', () => {
  const check = spawnSync('npx', ['--no-install', 'ai-sync', '--check'], { cwd: installed, encoding: 'utf8', env: cleanEnv() })
  assert.equal(check.status, 0, check.stdout + check.stderr)
})
