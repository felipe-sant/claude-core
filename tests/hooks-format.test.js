const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const h = require('./helpers')

afterEach(h.cleanup)

const template = JSON.parse(fs.readFileSync(path.join(h.repoRoot, 'templates', 'settings.hooks.json'), 'utf8'))
const formatEntry = template.hooks.PostToolUse.find((entry) => entry.matcher.split('|').includes('Edit'))
const formatCommand = formatEntry.hooks[0].command

function fakeTool(projectDir, name, { exitCode = 0, output = '' } = {}) {
  const bin = path.join(projectDir, 'node_modules', '.bin')
  fs.mkdirSync(bin, { recursive: true })
  const script = `#!/bin/sh\necho "$@" >> "${projectDir}/${name}.calls"\n${output ? `echo "${output}"\n` : ''}exit ${exitCode}\n`
  fs.writeFileSync(path.join(bin, name), script, { mode: 0o755 })
}

function calls(projectDir, name) {
  const file = path.join(projectDir, `${name}.calls`)
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n') : []
}

function makeProject({ prettierConfig = true } = {}) {
  const dir = h.tempDir('format-project')
  fs.mkdirSync(path.join(dir, 'src'))
  fs.writeFileSync(path.join(dir, 'src', 'a.js'), 'const a = 1\n')
  fs.writeFileSync(path.join(dir, 'README.md'), '# x\n')
  if (prettierConfig) fs.writeFileSync(path.join(dir, '.prettierrc'), '{}')
  return dir
}

function runFormat({ file, cwd, env = {}, raw }) {
  const input = raw !== undefined ? raw : JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: file }, cwd })
  const result = spawnSync('/bin/sh', ['-c', formatCommand], {
    input,
    cwd,
    encoding: 'utf8',
    env: { PATH: process.env.PATH, HOME: process.env.HOME, ...env }
  })
  return { status: result.status, stderr: result.stderr }
}

const quiet = (result) => {
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stderr, '')
}

test('o gancho de formatação vale para edição e escrita e tem tempo limite de 30 segundos', () => {
  assert.match(formatEntry.matcher, /Edit/)
  assert.match(formatEntry.matcher, /Write/)
  assert.equal(formatEntry.hooks[0].timeout, 30)
})

test('arquivo editado é formatado pelo prettier do projeto', () => {
  const dir = makeProject()
  fakeTool(dir, 'prettier')
  const file = path.join(dir, 'src', 'a.js')
  quiet(runFormat({ file, cwd: dir }))

  assert.deepEqual(calls(dir, 'prettier'), [`--write --ignore-unknown ${file}`])
})

test('prettier sem configuração do projeto não é chamado', () => {
  const dir = makeProject({ prettierConfig: false })
  fakeTool(dir, 'prettier')
  quiet(runFormat({ file: path.join(dir, 'src', 'a.js'), cwd: dir }))

  assert.deepEqual(calls(dir, 'prettier'), [])
})

test('configuração do prettier no package.json também vale', () => {
  const dir = makeProject({ prettierConfig: false })
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ prettier: { semi: false } }))
  fakeTool(dir, 'prettier')
  quiet(runFormat({ file: path.join(dir, 'src', 'a.js'), cwd: dir }))

  assert.equal(calls(dir, 'prettier').length, 1)
})

test('oxlint do projeto confere o arquivo de código e sem problemas termina sem mensagem', () => {
  const dir = makeProject()
  fakeTool(dir, 'oxlint')
  const file = path.join(dir, 'src', 'a.js')
  quiet(runFormat({ file, cwd: dir }))

  assert.deepEqual(calls(dir, 'oxlint'), [file])
})

test('oxlint com problemas avisa o agente e não desfaz a edição', () => {
  const dir = makeProject()
  fakeTool(dir, 'oxlint', { exitCode: 1, output: 'variavel-nao-usada' })
  const file = path.join(dir, 'src', 'a.js')
  const result = runFormat({ file, cwd: dir })

  assert.equal(result.status, 2)
  assert.match(result.stderr, /oxlint encontrou problemas/)
  assert.match(result.stderr, /variavel-nao-usada/)
  assert.equal(fs.readFileSync(file, 'utf8'), 'const a = 1\n')
})

test('oxlint não é chamado para arquivo que não é de código', () => {
  const dir = makeProject()
  fakeTool(dir, 'oxlint')
  quiet(runFormat({ file: path.join(dir, 'README.md'), cwd: dir }))

  assert.deepEqual(calls(dir, 'oxlint'), [])
})

test('oxlint que falha por erro interno sem mensagem não incomoda o agente', () => {
  const dir = makeProject()
  fakeTool(dir, 'oxlint', { exitCode: 2 })
  quiet(runFormat({ file: path.join(dir, 'src', 'a.js'), cwd: dir }))
})

test('ferramentas instaladas numa pasta acima do arquivo são usadas', () => {
  const dir = makeProject()
  fakeTool(dir, 'prettier')
  fs.mkdirSync(path.join(dir, 'packages', 'app', 'src'), { recursive: true })
  const file = path.join(dir, 'packages', 'app', 'src', 'b.js')
  fs.writeFileSync(file, 'x\n')
  quiet(runFormat({ file, cwd: dir }))

  assert.equal(calls(dir, 'prettier').length, 1)
})

test('arquivo numa worktree sem ferramentas instaladas não chama as da pasta principal', () => {
  const main = makeProject()
  fakeTool(main, 'prettier')
  fakeTool(main, 'oxlint')
  const tree = h.tempDir('format-worktree')
  fs.writeFileSync(path.join(tree, 'a.js'), 'x\n')
  quiet(runFormat({ file: path.join(tree, 'a.js'), cwd: main }))

  assert.deepEqual(calls(main, 'prettier'), [])
  assert.deepEqual(calls(main, 'oxlint'), [])
})

test('arquivo dentro de node_modules não é tocado', () => {
  const dir = makeProject()
  fakeTool(dir, 'prettier')
  fakeTool(dir, 'oxlint')
  const file = path.join(dir, 'node_modules', 'pacote', 'index.js')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, 'x\n')
  quiet(runFormat({ file, cwd: dir }))

  assert.deepEqual(calls(dir, 'prettier'), [])
  assert.deepEqual(calls(dir, 'oxlint'), [])
})

test('caminho relativo é resolvido a partir da pasta da sessão', () => {
  const dir = makeProject()
  fakeTool(dir, 'prettier')
  quiet(runFormat({ file: 'src/a.js', cwd: dir }))

  assert.equal(calls(dir, 'prettier').length, 1)
})

test('sem ferramentas, sem arquivo ou com entrada ilegível termina sem fazer nada e sem erro', () => {
  const dir = makeProject()
  quiet(runFormat({ file: path.join(dir, 'src', 'a.js'), cwd: dir }))
  quiet(runFormat({ file: path.join(dir, 'src', 'nao-existe.js'), cwd: dir }))
  quiet(runFormat({ file: path.join(dir, 'src'), cwd: dir }))
  quiet(runFormat({ raw: 'isto não é json', cwd: dir }))
  quiet(runFormat({ raw: '', cwd: dir }))
  quiet(runFormat({ raw: JSON.stringify({ tool_input: {} }), cwd: dir }))
})

test('com CLAUDE_KIT_HOOKS_OFF=1 nada é formatado nem conferido', () => {
  const dir = makeProject()
  fakeTool(dir, 'prettier')
  fakeTool(dir, 'oxlint', { exitCode: 1, output: 'erro' })
  quiet(runFormat({ file: path.join(dir, 'src', 'a.js'), cwd: dir, env: { CLAUDE_KIT_HOOKS_OFF: '1' } }))

  assert.deepEqual(calls(dir, 'prettier'), [])
  assert.deepEqual(calls(dir, 'oxlint'), [])
})

test('sem node no caminho de busca o gancho passa sem mensagem', () => {
  const dir = makeProject()
  fakeTool(dir, 'prettier')
  quiet(runFormat({ file: path.join(dir, 'src', 'a.js'), cwd: dir, env: { PATH: h.tempDir('sem-node') } }))

  assert.deepEqual(calls(dir, 'prettier'), [])
})
