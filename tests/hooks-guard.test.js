const { test, afterEach, before } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const h = require('./helpers')

afterEach(h.cleanup)

const template = JSON.parse(fs.readFileSync(path.join(h.repoRoot, 'templates', 'settings.hooks.json'), 'utf8'))
const guardCommand = template.hooks.PreToolUse.find((entry) => entry.matcher === 'Bash').hooks[0].command

const git = (cwd, ...args) =>
  spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8' })

function makeRepo(branch = 'main') {
  const dir = h.tempDir('guard-repo')
  git(dir, 'init', '-q', '-b', 'main')
  git(dir, 'commit', '-q', '--allow-empty', '-m', 'inicio')
  if (branch !== 'main') git(dir, 'switch', '-q', '-c', branch)
  return dir
}

function makeWorktree(repo, branch) {
  const dir = `${repo}-worktrees`
  fs.mkdirSync(dir, { recursive: true })
  const tree = path.join(dir, branch.replace(/\//g, '-'))
  git(repo, 'worktree', 'add', '-q', '-b', branch, tree)
  return tree
}

function runGuard({ command, cwd, env = {}, raw }) {
  const input = raw !== undefined ? raw : JSON.stringify({ tool_name: 'Bash', tool_input: { command }, cwd })
  const result = spawnSync('/bin/sh', ['-c', guardCommand], {
    input,
    cwd: cwd && fs.existsSync(cwd) ? cwd : undefined,
    encoding: 'utf8',
    env: { PATH: process.env.PATH, HOME: process.env.HOME, ...env }
  })
  return { status: result.status, stderr: result.stderr }
}

const blocked = (result) => {
  assert.equal(result.status, 2, result.stderr)
  assert.match(result.stderr, /Bloqueado pelo claude-kit/)
  assert.match(result.stderr, /CLAUDE_KIT_HOOKS_OFF=1/)
}

const allowed = (result) => {
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stderr, '')
}

before(() => {
  assert.ok(guardCommand, 'o modelo precisa ter o gancho de Bash')
})

for (const protectedBranch of ['main', 'master', 'develop', 'production']) {
  test(`commit na ${protectedBranch} é barrado com mensagem em português`, () => {
    const repo = makeRepo(protectedBranch)
    const result = runGuard({ command: 'git commit -m "x"', cwd: repo })
    blocked(result)
    assert.match(result.stderr, /commit direto em branch protegida/)
  })
}

test('commit em branch de tarefa passa', () => {
  allowed(runGuard({ command: 'git commit -m "x"', cwd: makeRepo('feat/1-x') }))
})

test('commit em worktree de tarefa, a partir da pasta na main, passa com cd e com git -C', () => {
  const repo = makeRepo()
  const tree = makeWorktree(repo, 'feat/2-y')
  allowed(runGuard({ command: `cd ${tree} && git commit -m "x"`, cwd: repo }))
  allowed(runGuard({ command: `git -C ${tree} commit -m "x"`, cwd: repo }))
})

test('commit numa pasta de destino em branch protegida é barrado mesmo vindo de outra pasta', () => {
  const repo = makeRepo()
  const tree = makeWorktree(repo, 'feat/3-z')
  blocked(runGuard({ command: `cd ${repo} && git commit -m "x"`, cwd: tree }))
  blocked(runGuard({ command: `git -C ${repo} commit -m "x"`, cwd: tree }))
})

test('pasta de destino que não dá para descobrir deixa passar', () => {
  const repo = makeRepo()
  allowed(runGuard({ command: 'cd $ALVO && git commit -m "x"', cwd: repo }))
  allowed(runGuard({ command: 'cd /pasta/que/nao/existe && git commit -m "x"', cwd: repo }))
  allowed(runGuard({ command: 'git -C $(pwd) commit -m "x"', cwd: repo }))
})

for (const command of [
  'git push origin main',
  'git push origin HEAD:main',
  'git push origin feat/x:main',
  'git push origin :main',
  'git push origin --delete main',
  'git push origin refs/heads/master',
  'git push origin production',
  'git push origin develop'
]) {
  test(`envio barrado: ${command}`, () => {
    blocked(runGuard({ command, cwd: makeRepo('feat/1-x') }))
  })
}

for (const command of [
  'git push origin 2>&1 | tail -5',
  'git push origin >/dev/null',
  'git push origin > saida.txt',
  'git push origin 2>/dev/null',
  'git push origin &>/dev/null',
  'git push origin >> log.txt 2>&1',
  'git push 2>&1',
  'git push origin </dev/null'
]) {
  test(`redirecionamento não vira destino do envio: ${command}`, () => {
    blocked(runGuard({ command, cwd: makeRepo() }))
  })
}

test('redirecionamento em comando liberado continua passando', () => {
  const cwd = makeRepo('feat/1-x')
  allowed(runGuard({ command: 'git push origin 2>&1 | tail -5', cwd }))
  allowed(runGuard({ command: 'git push -u origin feat/1-x >/dev/null 2>&1', cwd: makeRepo() }))
  allowed(runGuard({ command: 'git status 2>&1', cwd }))
})

test('push sem destino é barrado em branch protegida e passa em branch de tarefa', () => {
  blocked(runGuard({ command: 'git push', cwd: makeRepo() }))
  blocked(runGuard({ command: 'git push origin', cwd: makeRepo() }))
  blocked(runGuard({ command: 'git push origin HEAD', cwd: makeRepo() }))
  allowed(runGuard({ command: 'git push', cwd: makeRepo('feat/1-x') }))
  allowed(runGuard({ command: 'git push origin', cwd: makeRepo('feat/1-x') }))
})

test('push de branch de tarefa passa, mesmo estando na main', () => {
  allowed(runGuard({ command: 'git push -u origin feat/1-x', cwd: makeRepo() }))
})

for (const command of [
  'git push --force origin feat/x',
  'git push -f origin feat/x',
  'git push --force-with-lease origin feat/x',
  'git push --force-with-lease=feat/x origin feat/x',
  'git push --force-if-includes origin feat/x',
  'git push -uf origin feat/x',
  'git push origin +feat/x'
]) {
  test(`envio forçado barrado em qualquer branch: ${command}`, () => {
    const result = runGuard({ command, cwd: makeRepo('feat/1-x') })
    blocked(result)
    assert.match(result.stderr, /forçado/)
  })
}

for (const command of [
  'rm -r x',
  'rm -rf x',
  'rm -fr x',
  'rm -Rf x',
  'rm -r -f x',
  'rm --recursive x',
  'sudo rm -rf x',
  'sudo rm --recursive --force x'
]) {
  test(`remoção recursiva barrada: ${command}`, () => {
    const result = runGuard({ command, cwd: makeRepo('feat/1-x') })
    blocked(result)
    assert.match(result.stderr, /remoção recursiva/)
  })
}

test('remoção sem recursão passa', () => {
  allowed(runGuard({ command: 'rm arquivo.txt', cwd: makeRepo('feat/1-x') }))
  allowed(runGuard({ command: 'rm -f arquivo.txt', cwd: makeRepo('feat/1-x') }))
  allowed(runGuard({ command: 'rm -- -r', cwd: makeRepo('feat/1-x') }))
})

test('remoção recursiva de pasta criada por mktemp no mesmo comando passa', () => {
  const cwd = makeRepo('feat/1-x')
  allowed(runGuard({ command: 'T=$(mktemp -d) && ls "$T"; rm -rf "$T"', cwd }))
  allowed(runGuard({ command: 'T=$(mktemp -d) && node x.js "$T" && ls -R "$T/.claude"; rm -rf "$T"', cwd }))
  allowed(runGuard({ command: 'DIR=`mktemp -d`; rm -r ${DIR}', cwd }))
})

test('remoção recursiva com variável que não vem de mktemp ou foi reatribuída é barrada', () => {
  const cwd = makeRepo('feat/1-x')
  blocked(runGuard({ command: 'rm -rf "$T"', cwd }))
  blocked(runGuard({ command: 'T=/ && rm -rf "$T"', cwd }))
  blocked(runGuard({ command: 'T=$(mktemp -d); T=/; rm -rf "$T"', cwd }))
  blocked(runGuard({ command: 'T=$(mktemp -d); rm -rf "$T/.." ', cwd }))
  blocked(runGuard({ command: 'T=$(mktemp -d); rm -rf "$T" /etc', cwd }))
})

for (const command of [
  'npm test && git push --force origin feat/x',
  'ls; rm -rf x',
  'ls | xargs echo && rm -rf x',
  'echo ok\nrm -rf x',
  '(cd x && rm -rf y)',
  'if true; then rm -rf x; fi'
]) {
  test(`comando proibido encadeado é barrado: ${JSON.stringify(command)}`, () => {
    blocked(runGuard({ command, cwd: makeRepo('feat/1-x') }))
  })
}

test('comando proibido encadeado numa pasta na main é barrado', () => {
  blocked(runGuard({ command: 'true || git commit -m x', cwd: makeRepo() }))
})

test('texto proibido só dentro de aspas passa', () => {
  const cwd = makeRepo('feat/1-x')
  allowed(runGuard({ command: 'git commit -m "explica o rm -rf"', cwd }))
  allowed(runGuard({ command: 'echo "git push --force"', cwd }))
  allowed(runGuard({ command: "echo 'git push origin main; rm -rf x'", cwd }))
  allowed(runGuard({ command: 'git commit -m "$(cat <<\'EOF\'\nrm -rf x\nEOF\n)"', cwd }))
})

test('entrada ilegível, comando vazio, pasta sem git e comandos fora da lista passam sem mensagem', () => {
  const cwd = makeRepo('feat/1-x')
  allowed(runGuard({ raw: 'isto não é json', cwd }))
  allowed(runGuard({ raw: '', cwd }))
  allowed(runGuard({ raw: JSON.stringify({ tool_input: {} }), cwd }))
  allowed(runGuard({ command: '', cwd }))
  allowed(runGuard({ command: 'git commit -m x', cwd: h.tempDir('sem-git') }))
  for (const command of ['npm test', 'git status', 'git worktree remove ../x', 'ls -la', 'git push --dry-run']) {
    allowed(runGuard({ command, cwd }))
  }
})

test('sem git instalado o commit passa', () => {
  const repo = makeRepo()
  const onlyNode = h.tempDir('so-node')
  fs.symlinkSync(process.execPath, path.join(onlyNode, 'node'))
  allowed(runGuard({ command: 'git commit -m x', cwd: repo, env: { PATH: onlyNode } }))
})

test('sem node no caminho de busca o gancho passa sem mensagem', () => {
  const repo = makeRepo()
  const empty = h.tempDir('sem-node')
  allowed(runGuard({ command: 'git commit -m x', cwd: repo, env: { PATH: empty } }))
})

test('com CLAUDE_KIT_HOOKS_OFF=1 tudo passa', () => {
  const repo = makeRepo()
  const env = { CLAUDE_KIT_HOOKS_OFF: '1' }
  allowed(runGuard({ command: 'git commit -m x', cwd: repo, env }))
  allowed(runGuard({ command: 'git push --force origin main', cwd: repo, env }))
  allowed(runGuard({ command: 'rm -rf x', cwd: repo, env }))
})

test('CLAUDE_KIT_HOOKS_OFF com outro valor não desliga', () => {
  blocked(runGuard({ command: 'rm -rf x', cwd: makeRepo(), env: { CLAUDE_KIT_HOOKS_OFF: '0' } }))
})
