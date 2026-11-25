const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const h = require('./helpers')

const scriptPath = path.join(h.repoRoot, '.github', 'issue-agent', 'apply-claude-guide.js')
const { applyGuide, GUIDE_FILE, TARGET_FILE } = require(scriptPath)

function workspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apply-guide-'))
  const source = path.join(dir, 'issue-agent')
  fs.mkdirSync(source)
  const target = path.join(dir, 'CLAUDE.md')
  fs.writeFileSync(target, 'guia antigo\n')
  return { dir, source, target }
}

test('copia o texto preparado para o guia do Claude', () => {
  const { source, target } = workspace()
  fs.writeFileSync(path.join(source, GUIDE_FILE), 'guia novo\n')
  applyGuide(source, target)
  assert.equal(fs.readFileSync(target, 'utf8'), 'guia novo\n')
})

test('recusa quando o texto preparado não existe e não altera o guia', () => {
  const { source, target } = workspace()
  assert.throws(() => applyGuide(source, target), /não gravou/)
  assert.equal(fs.readFileSync(target, 'utf8'), 'guia antigo\n')
})

test('recusa quando o texto preparado está vazio e não altera o guia', () => {
  const { source, target } = workspace()
  fs.writeFileSync(path.join(source, GUIDE_FILE), '  \n')
  assert.throws(() => applyGuide(source, target), /vazio/)
  assert.equal(fs.readFileSync(target, 'utf8'), 'guia antigo\n')
})

test('escreve só no destino informado e nunca em outro arquivo da pasta', () => {
  const { dir, source, target } = workspace()
  const neighbor = path.join(dir, 'outro.md')
  fs.writeFileSync(neighbor, 'intocado\n')
  fs.writeFileSync(path.join(source, GUIDE_FILE), 'guia novo\n')
  applyGuide(source, target)
  assert.equal(fs.readFileSync(neighbor, 'utf8'), 'intocado\n')
  assert.deepEqual(fs.readdirSync(dir).sort(), ['CLAUDE.md', 'issue-agent', 'outro.md'])
})

test('o destino fixo é o guia do Claude na raiz do repositório', () => {
  assert.equal(TARGET_FILE, path.join(h.repoRoot, '.claude', 'CLAUDE.md'))
})

test('rodado sem a pasta temporária da execução, recusa com mensagem e erro', () => {
  const before = fs.readFileSync(TARGET_FILE, 'utf8')
  const env = { ...process.env }
  delete env.RUNNER_TEMP
  const result = spawnSync('node', [scriptPath], { env, encoding: 'utf8' })
  assert.equal(result.status, 1)
  assert.match(result.stdout, /::error::/)
  assert.equal(fs.readFileSync(TARGET_FILE, 'utf8'), before)
})

test('rodado sem o texto preparado, recusa com erro e não altera o guia', () => {
  const before = fs.readFileSync(TARGET_FILE, 'utf8')
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-temp-'))
  const result = spawnSync('node', [scriptPath], { env: { ...process.env, RUNNER_TEMP: temp }, encoding: 'utf8' })
  assert.equal(result.status, 1)
  assert.match(result.stdout, /::error::/)
  assert.equal(fs.readFileSync(TARGET_FILE, 'utf8'), before)
})
