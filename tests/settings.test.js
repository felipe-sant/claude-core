const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const h = require('./helpers')

afterEach(h.cleanup)

const template = {
  effortLevel: 'medium',
  env: { QUIET: '1', OTHER: 'a' },
  permissions: { deny: ['Read(./.env)'] }
}

function core() {
  return h.makeCore({
    items: [
      { group: 'agents', name: 'orchestrator', files: '---\nname: orchestrator\ndescription: x\nmodel: sonnet\n---\n' },
      { group: 'settings', name: 'base', files: template }
    ],
    profiles: {
      comBase: { agents: ['orchestrator'], settings: ['base'] },
      semBase: { agents: ['orchestrator'] }
    }
  })
}

const settings = (target) => JSON.parse(h.read(target, '.claude/settings.json'))

test('projeto sem configuração recebe a configuração base criada', () => {
  const target = h.makeTarget()
  const result = h.run(core(), target)

  assert.equal(result.status, 0)
  assert.deepEqual(settings(target), template)
  assert.match(result.output, /Configuração base criada em \.claude\/settings\.json/)
  assert.match(result.output, /effortLevel/)
})

test('o que o usuário definiu nunca é alterado e só o que falta é acrescentado', () => {
  const mine = { effortLevel: 'high', env: { QUIET: '0' }, model: 'opus', permissions: { allow: ['Bash(ls)'] } }
  const target = h.makeTarget({ '.claude/settings.json': JSON.stringify(mine) })
  const result = h.run(core(), target)
  const after = settings(target)

  assert.equal(after.effortLevel, 'high')
  assert.equal(after.env.QUIET, '0')
  assert.equal(after.model, 'opus')
  assert.deepEqual(after.permissions.allow, ['Bash(ls)'])
  assert.equal(after.env.OTHER, 'a')
  assert.deepEqual(after.permissions.deny, ['Read(./.env)'])
  assert.match(result.output, /acrescentada em \.claude\/settings\.json/)
  assert.match(result.output, /env\.OTHER/)
  assert.match(result.output, /permissions\.deny/)
})

test('o que foi sugerido e não aplicado é listado com o valor atual e o recomendado', () => {
  const target = h.makeTarget({
    '.claude/settings.json': JSON.stringify({ effortLevel: 'high', env: { QUIET: '0' }, permissions: { deny: ['Read(./x)'] } })
  })
  const result = h.run(core(), target)

  assert.match(result.output, /Sugerido e não aplicado/)
  assert.match(result.output, /effortLevel: está "high", recomendado "medium"/)
  assert.match(result.output, /env\.QUIET: está "0", recomendado "1"/)
  assert.match(result.output, /permissions\.deny: está \["Read\(\.\/x\)"\]/)
  assert.deepEqual(settings(target).permissions.deny, ['Read(./x)'])
})

test('arquivo que já está igual ao recomendado não muda e não gera sugestão', () => {
  const target = h.makeTarget({ '.claude/settings.json': JSON.stringify(template) })
  const before = h.read(target, '.claude/settings.json')
  const result = h.run(core(), target)

  assert.equal(h.read(target, '.claude/settings.json'), before)
  assert.doesNotMatch(result.output, /Sugerido/)
})

test('rodar de novo não muda nada, mesmo com sugestões pendentes', () => {
  const target = h.makeTarget({ '.claude/settings.json': JSON.stringify({ effortLevel: 'high' }) })
  h.run(core(), target)
  const before = h.snapshot(target)
  const second = h.run(core(), target)

  assert.equal(h.snapshot(target), before)
  assert.match(second.output, /Tudo em dia, nada mudou/)
  assert.match(second.output, /Sugerido e não aplicado/)
})

test('chave que o usuário removeu depois de a ferramenta acrescentar não volta', () => {
  const target = h.makeTarget()
  h.run(core(), target)
  const edited = settings(target)
  delete edited.env.OTHER
  delete edited.effortLevel
  fs.writeFileSync(path.join(target, '.claude/settings.json'), JSON.stringify(edited))
  const result = h.run(core(), target)

  assert.equal(settings(target).effortLevel, undefined)
  assert.equal(settings(target).env.OTHER, undefined)
  assert.doesNotMatch(result.output, /acrescentada/)
})

test('arquivo apagado pelo usuário depois da primeira vez não é recriado', () => {
  const target = h.makeTarget()
  h.run(core(), target)
  fs.rmSync(path.join(target, '.claude/settings.json'))
  h.run(core(), target)

  assert.ok(!h.exists(target, '.claude/settings.json'))
})

test('settings.json inválido não é tocado e a ferramenta avisa', () => {
  const target = h.makeTarget({ '.claude/settings.json': '{ quebrado' })
  const result = h.run(core(), target)

  assert.equal(h.read(target, '.claude/settings.json'), '{ quebrado')
  assert.match(result.output, /\.claude\/settings\.json não é um JSON válido/)
})

test('perfil manual só aplica a configuração base se o perfil a listar', () => {
  const withBase = h.makeTarget()
  h.run(core(), withBase, '--profile', 'comBase')
  assert.ok(h.exists(withBase, '.claude/settings.json'))

  const without = h.makeTarget()
  h.run(core(), without, '--profile', 'semBase')
  assert.ok(!h.exists(without, '.claude/settings.json'))
})

test('a configuração compartilhada fica separada da local e a local fica fora do git', () => {
  const target = h.makeTarget({ '.git/HEAD': 'ref: refs/heads/main\n' })
  h.run(core(), target)
  h.run(core(), target)

  const local = JSON.parse(h.read(target, '.claude/settings.local.json'))
  assert.deepEqual(Object.keys(local), ['permissions'])
  assert.deepEqual(Object.keys(local.permissions).sort(), ['additionalDirectories', 'allow'])
  assert.deepEqual(settings(target), template)
  const exclude = h.read(target, '.git/info/exclude').split('\n')
  assert.equal(exclude.filter((l) => l === '.claude/settings.local.json').length, 1)
  assert.equal(exclude.filter((l) => l === '.claude/team-memory/').length, 1)
})

test('a única permissão nova que a ferramenta concede é a da pasta de worktrees', () => {
  const target = h.makeTarget()
  h.run(core(), target)

  const shared = settings(target)
  assert.equal(shared.permissions.allow, undefined)
  const local = JSON.parse(h.read(target, '.claude/settings.local.json'))
  assert.deepEqual(local.permissions.allow, [`Edit(/${target}-worktrees/**)`])
})

test('o modelo do repositório cria a configuração em um projeto novo e não concede permissões amplas', () => {
  const script = path.join(h.repoRoot, 'bin', 'ai-sync.js')
  const target = h.makeTarget()
  const result = spawnSync('node', [script, target], { encoding: 'utf8' })

  assert.equal(result.status, 0, result.stderr)
  const shared = settings(target)
  assert.ok(shared.effortLevel)
  assert.ok(shared.permissions.deny.includes('Read(./.env)'))
  assert.equal(shared.permissions.allow, undefined)
  assert.equal(shared.permissions.defaultMode, undefined)
})

test('o modelo do repositório respeita um projeto que já tem configuração', () => {
  const script = path.join(h.repoRoot, 'bin', 'ai-sync.js')
  const mine = { effortLevel: 'xhigh', hooks: { Stop: [] }, permissions: { deny: ['Read(./segredo)'] } }
  const target = h.makeTarget({ '.claude/settings.json': JSON.stringify(mine) })
  const result = spawnSync('node', [script, target], { encoding: 'utf8' })
  const after = settings(target)

  assert.equal(after.effortLevel, 'xhigh')
  assert.deepEqual(after.hooks, { Stop: [] })
  assert.deepEqual(after.permissions.deny, ['Read(./segredo)'])
  assert.match(result.stdout, /Sugerido e não aplicado/)
})
