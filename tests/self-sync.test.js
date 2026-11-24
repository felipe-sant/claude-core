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

  const expected = JSON.parse(h.read(target, '.claude/claude-core.lock.json'))
  const lockFile = path.join(h.repoRoot, '.claude', 'claude-core.lock.json')
  assert.ok(fs.existsSync(lockFile), 'falta o .claude/claude-core.lock.json: rode npm run sync')
  const actual = JSON.parse(fs.readFileSync(lockFile, 'utf8'))

  assert.deepEqual(Object.keys(actual.files).sort(), Object.keys(expected.files).sort(), 'os arquivos do .claude não batem com o catálogo: rode npm run sync')
  for (const rel of [...Object.keys(expected.files), '.claude/claude-core.lock.json', '.claude/settings.json']) {
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
