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

test('recusa quando o texto preparado é um link simbólico e não lê o arquivo apontado', () => {
  const { dir, source, target } = workspace()
  const secret = path.join(dir, 'segredo.txt')
  fs.writeFileSync(secret, 'conteúdo de outro arquivo\n')
  fs.symlinkSync(secret, path.join(source, GUIDE_FILE))
  assert.throws(() => applyGuide(source, target), /arquivo comum/)
  assert.equal(fs.readFileSync(target, 'utf8'), 'guia antigo\n')
})

test('recusa quando o texto preparado é uma pasta', () => {
  const { source, target } = workspace()
  fs.mkdirSync(path.join(source, GUIDE_FILE))
  assert.throws(() => applyGuide(source, target), /arquivo comum/)
  assert.equal(fs.readFileSync(target, 'utf8'), 'guia antigo\n')
})

test('recusa quando o guia é um link simbólico e não grava no arquivo apontado', () => {
  const { dir, source } = workspace()
  const outside = path.join(dir, 'fora.txt')
  fs.writeFileSync(outside, 'intocado\n')
  const link = path.join(dir, 'link-CLAUDE.md')
  fs.symlinkSync(outside, link)
  fs.writeFileSync(path.join(source, GUIDE_FILE), 'guia novo\n')
  assert.throws(() => applyGuide(source, link), /arquivo comum/)
  assert.equal(fs.readFileSync(outside, 'utf8'), 'intocado\n')
  assert.ok(fs.lstatSync(link).isSymbolicLink())
})

test('recusa quando o guia é um link simbólico quebrado e não cria o arquivo apontado', () => {
  const { dir, source } = workspace()
  const missing = path.join(dir, 'nao-existe.txt')
  const link = path.join(dir, 'link-quebrado.md')
  fs.symlinkSync(missing, link)
  fs.writeFileSync(path.join(source, GUIDE_FILE), 'guia novo\n')
  assert.throws(() => applyGuide(source, link), /arquivo comum/)
  assert.equal(fs.existsSync(missing), false)
})

test('quando o guia ainda não existe, cria o arquivo', () => {
  const { dir, source } = workspace()
  const novo = path.join(dir, 'novo-CLAUDE.md')
  fs.writeFileSync(path.join(source, GUIDE_FILE), 'guia novo\n')
  applyGuide(source, novo)
  assert.equal(fs.readFileSync(novo, 'utf8'), 'guia novo\n')
})

test('recusa quando a pasta do texto preparado é um link simbólico', () => {
  const { dir, source, target } = workspace()
  fs.writeFileSync(path.join(source, GUIDE_FILE), 'guia novo\n')
  const link = path.join(dir, 'link-issue-agent')
  fs.symlinkSync(source, link)
  assert.throws(() => applyGuide(link, target), /pasta comum/)
  assert.equal(fs.readFileSync(target, 'utf8'), 'guia antigo\n')
})

test('recusa quando a pasta do guia é um link simbólico e não grava na pasta apontada', () => {
  const { dir, source } = workspace()
  const realFolder = path.join(dir, 'pasta-real')
  fs.mkdirSync(realFolder)
  fs.writeFileSync(path.join(realFolder, 'CLAUDE.md'), 'intocado\n')
  const linkFolder = path.join(dir, 'link-claude')
  fs.symlinkSync(realFolder, linkFolder)
  fs.writeFileSync(path.join(source, GUIDE_FILE), 'guia novo\n')
  assert.throws(() => applyGuide(source, path.join(linkFolder, 'CLAUDE.md')), /pasta comum/)
  assert.equal(fs.readFileSync(path.join(realFolder, 'CLAUDE.md'), 'utf8'), 'intocado\n')
})

test('recusa quando o guia é uma pasta e não mexe nela', () => {
  const { dir, source } = workspace()
  const folderTarget = path.join(dir, 'guia-pasta')
  fs.mkdirSync(folderTarget)
  fs.writeFileSync(path.join(source, GUIDE_FILE), 'guia novo\n')
  assert.throws(() => applyGuide(source, folderTarget), /arquivo comum/)
  assert.deepEqual(fs.readdirSync(folderTarget), [])
})
