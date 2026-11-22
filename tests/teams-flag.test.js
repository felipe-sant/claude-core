const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const h = require('./helpers')

afterEach(h.cleanup)

const FLAG = 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS'

function core() {
  return h.makeCore({
    items: [{ group: 'agents', name: 'orchestrator', files: '---\nname: orchestrator\ndescription: x\nmodel: sonnet\n---\n' }]
  })
}

const local = (target) => JSON.parse(h.read(target, '.claude/settings.local.json'))

test('sem --teams o recurso de times não é ligado', () => {
  const target = h.makeTarget()
  h.run(core(), target)

  assert.equal(local(target).env?.[FLAG], undefined)
})

test('--teams liga o recurso no settings.local.json e mantém o que já existe lá', () => {
  const target = h.makeTarget({
    '.claude/settings.local.json': JSON.stringify({ env: { MINHA: 'x' }, permissions: { allow: ['Bash(ls)'] } })
  })
  const result = h.run(core(), target, '--teams')
  const settings = local(target)

  assert.equal(result.status, 0, result.output)
  assert.equal(settings.env[FLAG], '1')
  assert.equal(settings.env.MINHA, 'x')
  assert.ok(settings.permissions.allow.includes('Bash(ls)'))
  assert.match(result.output, /Times de agentes ligado em \.claude\/settings\.local\.json/)
  assert.match(result.output, /sessão nova/)
})

test('--teams não mexe no settings.json compartilhado e é idempotente', () => {
  const target = h.makeTarget()
  h.run(core(), target, '--teams')
  const before = h.snapshot(target)
  const second = h.run(core(), target, '--teams')

  assert.ok(!h.exists(target, '.claude/settings.json'))
  assert.equal(h.snapshot(target), before)
  assert.doesNotMatch(second.output, /Times de agentes ligado/)
})

test('--no-teams desliga o recurso sem apagar o resto do settings.local.json', () => {
  const target = h.makeTarget({
    '.claude/settings.local.json': JSON.stringify({ env: { [FLAG]: '1', MINHA: 'x' } })
  })
  const result = h.run(core(), target, '--no-teams')
  const settings = local(target)

  assert.equal(result.status, 0, result.output)
  assert.equal(settings.env[FLAG], undefined)
  assert.equal(settings.env.MINHA, 'x')
  assert.match(result.output, /Times de agentes desligado/)
})

test('--no-teams sem o recurso ligado não altera nada', () => {
  const target = h.makeTarget()
  h.run(core(), target)
  const before = h.snapshot(target)
  h.run(core(), target, '--no-teams')

  assert.equal(h.snapshot(target), before)
})

test('settings.local.json inválido não é tocado e a ferramenta avisa', () => {
  const target = h.makeTarget({ '.claude/settings.local.json': '{ quebrado' })
  const result = h.run(core(), target, '--teams')

  assert.equal(h.read(target, '.claude/settings.local.json'), '{ quebrado')
  assert.match(result.output, new RegExp(`${FLAG}`))
  assert.match(result.output, /não é um JSON válido/)
})

test('o arquivo local continua fora do git depois do --teams', () => {
  const target = h.makeTarget()
  fs.mkdirSync(path.join(target, '.git'))
  h.run(core(), target, '--teams')

  assert.match(h.read(target, '.git/info/exclude'), /\.claude\/settings\.local\.json/)
})
