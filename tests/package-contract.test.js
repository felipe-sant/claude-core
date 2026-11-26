const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { isValidChangesetNote } = require('../scripts/changeset-note')

const root = path.resolve(__dirname, '..')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const packageName = '@felipe-sant/claude-kit'

test('o pacote se chama @felipe-sant/claude-kit, é público e leva só os arquivos do ai-sync', () => {
  assert.equal(pkg.name, packageName)
  assert.notEqual(pkg.private, true)
  assert.equal(pkg.publishConfig.access, 'public')
  assert.equal(pkg.bin['ai-sync'], 'bin/ai-sync.js')
  assert.deepEqual([...pkg.files].sort(), ['agents', 'bin', 'catalog.json', 'profiles', 'rules', 'skills', 'stacks', 'templates'])
  assert.match(pkg.repository.url, /github\.com\/felipe-sant\/claude-kit/)
  assert.equal(pkg.dependencies, undefined)
  assert.ok(pkg.devDependencies['@changesets/cli'])
  assert.ok(pkg.devDependencies['@changesets/changelog-github'])
})

test('o pacote usa a licença MIT de Luiz Felipe, de 2026', () => {
  assert.equal(pkg.license, 'MIT')
  const license = fs.readFileSync(path.join(root, 'LICENSE'), 'utf8')
  assert.match(license, /^MIT License/)
  assert.match(license, /Copyright \(c\) 2026 Luiz Felipe/)
  assert.match(license, /Permission is hereby granted, free of charge/)
})

test('os scripts de versão do contrato existem e os antigos seguem iguais', () => {
  assert.equal(pkg.scripts.changeset, 'changeset')
  assert.equal(pkg.scripts['changeset:version'], 'changeset version && npm install --package-lock-only --ignore-scripts && npm run sync:version')
  assert.equal(pkg.scripts['sync:version'], 'rm -f .claude/claude-kit.lock.json && npm run sync')
  assert.equal(pkg.scripts.sync, 'node bin/ai-sync.js . --profile tooling')
})

test('a configuração do changeset aponta para a main e para o pacote público', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, '.changeset', 'config.json'), 'utf8'))
  assert.deepEqual(config.changelog, ['@changesets/changelog-github', { repo: 'felipe-sant/claude-kit' }])
  assert.equal(config.baseBranch, 'main')
  assert.equal(config.access, 'public')
  assert.equal(config.commit, false)
})

test('todas as notas de mudança do repositório seguem o contrato', () => {
  const dir = path.join(root, '.changeset')
  const notes = fs.readdirSync(dir).filter((name) => name.endsWith('.md') && name !== 'README.md')
  for (const name of notes) {
    assert.ok(isValidChangesetNote(fs.readFileSync(path.join(dir, name), 'utf8')), `${name} não segue o contrato`)
  }
})

test('nota vazia é aceita nas duas formas', () => {
  assert.ok(isValidChangesetNote('---\n\n---\n\n\n'))
  assert.ok(isValidChangesetNote('---\n---\n'))
  assert.ok(isValidChangesetNote('---\n---\n\n'))
})

test('nota com tipo e texto é aceita', () => {
  for (const type of ['patch', 'minor', 'major']) {
    assert.ok(isValidChangesetNote(`---\n"${packageName}": ${type}\n---\n\nCorrige a mensagem do ai-sync.\n`))
  }
})

test('nota com tipo inválido é recusada', () => {
  assert.equal(isValidChangesetNote(`---\n"${packageName}": gigante\n---\n\nTexto.\n`), false)
})

test('nota de outro pacote é recusada', () => {
  assert.equal(isValidChangesetNote('---\n"outro-pacote": patch\n---\n\nTexto.\n'), false)
})

test('nota com tipo e sem corpo é recusada', () => {
  assert.equal(isValidChangesetNote(`---\n"${packageName}": patch\n---\n\n`), false)
})

test('nota sem cabeçalho ou com conteúdo solto é recusada', () => {
  assert.equal(isValidChangesetNote('Só texto\n'), false)
  assert.equal(isValidChangesetNote('---\n---\ntexto sem tipo\n'), false)
})
