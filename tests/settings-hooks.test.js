const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const h = require('./helpers')

afterEach(h.cleanup)

const LOCK = '.claude/claude-kit.lock.json'
const SETTINGS = '.claude/settings.json'

const entry = (matcher, command, timeout = 10) => ({ matcher, hooks: [{ type: 'command', command, timeout }] })
const idOf = (value) => crypto.createHash('sha1').update(JSON.stringify(value)).digest('hex').slice(0, 10)

const guard = entry('Bash', 'guard-v1')
const format = entry('Edit|Write', 'format-v1', 30)

const hooksTemplate = (pre = [guard], post = [format]) => ({ hooks: { PreToolUse: pre, PostToolUse: post } })

function core(hooks = hooksTemplate(), extra = []) {
  return h.makeCore({
    items: [
      { group: 'agents', name: 'orchestrator', files: '---\nname: orchestrator\ndescription: x\nmodel: sonnet\n---\n' },
      { group: 'settings', name: 'hooks', files: hooks },
      ...extra
    ],
    profiles: { p: { agents: ['orchestrator'], settings: ['hooks', ...extra.map((item) => item.name)] } }
  })
}

const settings = (target) => JSON.parse(h.read(target, SETTINGS))
const applied = (target) => JSON.parse(h.read(target, LOCK)).settings?.applied || []
const write = (target, value) => fs.writeFileSync(path.join(target, SETTINGS), JSON.stringify(value))

test('projeto sem configuração recebe os dois ganchos e eles ficam registrados', () => {
  const target = h.makeTarget()
  const result = h.run(core(), target)

  assert.equal(result.status, 0, result.output)
  assert.deepEqual(settings(target), hooksTemplate())
  assert.deepEqual(applied(target), [`hooks.PostToolUse.${idOf(format)}`, `hooks.PreToolUse.${idOf(guard)}`])
  assert.match(result.output, /hooks\.PreToolUse \(Bash\)/)
  assert.match(result.output, /hooks\.PostToolUse \(Edit\|Write\)/)
  assert.doesNotMatch(result.output, /guard-v1/)
})

test('projeto com gancho próprio em PreToolUse recebe o do kit ao lado e mantém o seu', () => {
  const mine = entry('Bash', 'meu-gancho')
  const stop = { hooks: [{ type: 'command', command: 'parar' }] }
  const target = h.makeTarget({ [SETTINGS]: JSON.stringify({ hooks: { PreToolUse: [mine], Stop: [stop] } }) })
  const result = h.run(core(), target)

  assert.equal(result.status, 0, result.output)
  assert.deepEqual(settings(target).hooks.PreToolUse, [mine, guard])
  assert.deepEqual(settings(target).hooks.Stop, [stop])
  assert.deepEqual(settings(target).hooks.PostToolUse, [format])
  assert.doesNotMatch(result.output, /Sugerido/)
})

test('rodar de novo não muda nada e o gancho aparece uma vez só', () => {
  const target = h.makeTarget({ [SETTINGS]: JSON.stringify({ hooks: { PreToolUse: [entry('Bash', 'meu-gancho')] } }) })
  h.run(core(), target)
  const before = h.snapshot(target)
  const second = h.run(core(), target)

  assert.equal(h.snapshot(target), before)
  assert.match(second.output, /Tudo em dia, nada mudou/)
  assert.equal(settings(target).hooks.PreToolUse.filter((item) => item.hooks[0].command === 'guard-v1').length, 1)
})

test('gancho que o dono apagou não volta', () => {
  const target = h.makeTarget()
  h.run(core(), target)
  const edited = settings(target)
  edited.hooks.PreToolUse = [entry('Bash', 'meu-gancho')]
  write(target, edited)
  h.run(core(), target)

  assert.deepEqual(settings(target).hooks.PreToolUse, [entry('Bash', 'meu-gancho')])
})

test('lista inteira de um momento apagada pelo dono não volta', () => {
  const target = h.makeTarget()
  h.run(core(), target)
  const edited = settings(target)
  delete edited.hooks.PreToolUse
  write(target, edited)
  h.run(core(), target)

  assert.equal(settings(target).hooks.PreToolUse, undefined)
  assert.deepEqual(settings(target).hooks.PostToolUse, [format])
})

test('grupo inteiro de ganchos apagado pelo dono não volta', () => {
  const target = h.makeTarget()
  h.run(core(), target)
  write(target, { model: 'opus' })
  h.run(core(), target)

  assert.deepEqual(settings(target), { model: 'opus' })
})

test('gancho alterado pelo kit troca o anterior no mesmo lugar quando o dono não mexeu', () => {
  const mine = entry('Bash', 'meu-gancho')
  const target = h.makeTarget({ [SETTINGS]: JSON.stringify({ hooks: { PreToolUse: [mine] } }) })
  h.run(core(), target)
  const guardV2 = entry('Bash', 'guard-v2')
  const edited = settings(target)
  edited.hooks.PreToolUse.push(entry('Read', 'depois'))
  write(target, edited)
  const result = h.run(core(hooksTemplate([guardV2])), target)

  assert.equal(result.status, 0, result.output)
  assert.deepEqual(settings(target).hooks.PreToolUse, [mine, guardV2, entry('Read', 'depois')])
  assert.ok(applied(target).includes(`hooks.PreToolUse.${idOf(guardV2)}`))
  assert.ok(!applied(target).includes(`hooks.PreToolUse.${idOf(guard)}`))
})

test('gancho alterado pelo kit não entra quando o dono mudou o anterior e vira sugestão', () => {
  const target = h.makeTarget()
  h.run(core(), target)
  const mine = entry('Bash', 'guard-do-dono')
  const edited = settings(target)
  edited.hooks.PreToolUse = [mine]
  write(target, edited)
  const result = h.run(core(hooksTemplate([entry('Bash', 'guard-v2')])), target)

  assert.deepEqual(settings(target).hooks.PreToolUse, [mine])
  assert.match(result.output, /Sugerido e não aplicado/)
  assert.match(result.output, /hooks\.PreToolUse \(Bash\)/)
})

test('registro apagado com gancho igual ao do kit registra sem duplicar', () => {
  const target = h.makeTarget({ [SETTINGS]: JSON.stringify(hooksTemplate()) })
  const before = h.read(target, SETTINGS)
  const result = h.run(core(), target)

  assert.equal(result.status, 0, result.output)
  assert.equal(h.read(target, SETTINGS), before)
  assert.deepEqual(applied(target), [`hooks.PostToolUse.${idOf(format)}`, `hooks.PreToolUse.${idOf(guard)}`])
})

test('ganchos em formato desconhecido não são tocados e os do kit viram sugestão', () => {
  const mine = { PreToolUse: 'qualquer coisa' }
  const target = h.makeTarget({ [SETTINGS]: JSON.stringify({ hooks: mine }) })
  const result = h.run(core(), target)

  assert.deepEqual(settings(target).hooks.PreToolUse, 'qualquer coisa')
  assert.match(result.output, /Sugerido e não aplicado/)
  assert.match(result.output, /hooks\.PreToolUse \(Bash\)/)
  assert.deepEqual(settings(target).hooks.PostToolUse, [format])
})

test('grupo de ganchos que não é objeto não é tocado', () => {
  const target = h.makeTarget({ [SETTINGS]: JSON.stringify({ hooks: [1] }) })
  const result = h.run(core(), target)

  assert.deepEqual(settings(target).hooks, [1])
  assert.match(result.output, /Sugerido e não aplicado/)
})

test('dois modelos com ganchos no mesmo momento são juntados', () => {
  const other = entry('Bash', 'outro-gancho')
  const target = h.makeTarget()
  const result = h.run(core(hooksTemplate(), [{ group: 'settings', name: 'extra', files: { hooks: { PreToolUse: [other] } } }]), target)

  assert.equal(result.status, 0, result.output)
  assert.deepEqual(settings(target).hooks.PreToolUse, [guard, other])
  assert.deepEqual(settings(target).hooks.PostToolUse, [format])
})

test('as outras chaves se comportam como antes ao lado dos ganchos', () => {
  const base = { effortLevel: 'medium', hooks: hooksTemplate().hooks }
  const target = h.makeTarget({ [SETTINGS]: JSON.stringify({ effortLevel: 'high' }) })
  const result = h.run(core(base), target)

  assert.equal(settings(target).effortLevel, 'high')
  assert.match(result.output, /effortLevel: está "high", recomendado "medium"/)
  assert.deepEqual(settings(target).hooks, hooksTemplate().hooks)
})
