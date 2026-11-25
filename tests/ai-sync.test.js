const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')
const h = require('./helpers')

afterEach(h.cleanup)

const agent = (name, extra = '') => `---\nname: ${name}\ndescription: ${name}\nmodel: sonnet\n---\n\n${name}${extra}\n`

function basicCore(overrides = {}) {
  return h.makeCore({
    items: [
      { group: 'agents', name: 'orchestrator', files: agent('orchestrator') },
      { group: 'agents', name: 'qa', files: agent('qa') },
      { group: 'agents', name: 'designer', files: agent('designer') },
      { group: 'rules', name: 'commit-standard', files: '# Commits\n' }
    ],
    stacks: {
      react: { description: 'React', detect: { dependencies: ['react'] } },
      nestjs: { description: 'NestJS', detect: { dependencies: ['@nestjs/core'] } },
      laravel: { description: 'Laravel', detect: { dependencies: ['laravel/framework'] } }
    },
    profiles: { minimal: { agents: ['orchestrator'], rules: [] } },
    ...overrides
  })
}

function stackCore() {
  return h.makeCore({
    items: [
      { group: 'agents', name: 'orchestrator', files: agent('orchestrator') },
      { group: 'rules', name: 'react-standard', applies: ['react'], files: '# React\n' },
      { group: 'rules', name: 'nestjs-standard', applies: ['nestjs'], files: '# Nest\n' }
    ],
    stacks: {
      react: { description: 'React', detect: { dependencies: ['react'] } },
      nestjs: { description: 'NestJS', detect: { dependencies: ['@nestjs/core'] } },
      laravel: { description: 'Laravel', detect: { dependencies: ['laravel/framework'] } }
    },
    profiles: { minimal: { agents: ['orchestrator'], rules: [] } }
  })
}

test('aplica tudo o que vale para qualquer projeto e registra o que instalou', () => {
  const core = basicCore()
  const target = h.makeTarget()
  const result = h.run(core, target)

  assert.equal(result.status, 0)
  assert.ok(h.exists(target, '.claude/agents/orchestrator.md'))
  assert.ok(h.exists(target, '.claude/agents/qa.md'))
  assert.ok(h.exists(target, '.claude/rules/commit-standard.md'))

  const lock = JSON.parse(h.read(target, '.claude/claude-kit.lock.json'))
  assert.deepEqual(Object.keys(lock.files).sort(), [
    '.claude/agents/designer.md',
    '.claude/agents/orchestrator.md',
    '.claude/agents/qa.md',
    '.claude/rules/commit-standard.md'
  ])
  assert.equal(lock.files['.claude/agents/qa.md'].version, '1.0.0')
  assert.match(lock.files['.claude/agents/qa.md'].hash, /^[0-9a-f]{64}$/)
})

test('perfil manual aplica só o que o perfil lista', () => {
  const core = basicCore()
  const target = h.makeTarget()
  const result = h.run(core, target, '--profile', 'minimal')

  assert.equal(result.status, 0)
  assert.ok(h.exists(target, '.claude/agents/orchestrator.md'))
  assert.ok(!h.exists(target, '.claude/agents/qa.md'))
  assert.ok(!h.exists(target, '.claude/rules'))
  assert.match(result.output, /sem detecção de stack/)
})

test('perfil inexistente falha e lista os disponíveis', () => {
  const core = basicCore()
  const result = h.run(core, h.makeTarget(), '--profile', 'nao-existe')

  assert.equal(result.status, 1)
  assert.match(result.output, /minimal/)
})

test('pasta inexistente falha', () => {
  const core = basicCore()
  const result = h.run(core, path.join(h.tempDir('base'), 'nao-existe'))

  assert.equal(result.status, 1)
  assert.match(result.output, /Pasta não encontrada/)
})

test('projeto sem stack conhecida recebe só o básico e é avisado', () => {
  const core = stackCore()
  const target = h.makeTarget({ 'package.json': JSON.stringify({ dependencies: { express: '1' } }) })
  const result = h.run(core, target)

  assert.equal(result.status, 0)
  assert.ok(h.exists(target, '.claude/agents/orchestrator.md'))
  assert.ok(!h.exists(target, '.claude/rules'))
  assert.match(result.output, /Stacks detectadas: nenhuma/)
  assert.match(result.output, /Nenhuma stack reconhecida/)
})

test('projeto React recebe o conteúdo de React', () => {
  const core = stackCore()
  const target = h.makeTarget({ 'package.json': JSON.stringify({ dependencies: { react: '18' } }) })
  const result = h.run(core, target)

  assert.match(result.output, /Stacks detectadas: react$/m)
  assert.ok(h.exists(target, '.claude/rules/react-standard.md'))
  assert.ok(!h.exists(target, '.claude/rules/nestjs-standard.md'))
})

test('projeto NestJS recebe o conteúdo de NestJS, mesmo em devDependencies', () => {
  const core = stackCore()
  const target = h.makeTarget({ 'package.json': JSON.stringify({ devDependencies: { '@nestjs/core': '10' } }) })
  const result = h.run(core, target)

  assert.match(result.output, /Stacks detectadas: nestjs$/m)
  assert.ok(h.exists(target, '.claude/rules/nestjs-standard.md'))
  assert.ok(!h.exists(target, '.claude/rules/react-standard.md'))
})

test('projeto com painel e API em pastas separadas recebe as duas stacks', () => {
  const core = stackCore()
  const target = h.makeTarget({
    'web/package.json': JSON.stringify({ dependencies: { react: '18' } }),
    'api/package.json': JSON.stringify({ dependencies: { '@nestjs/core': '10' } })
  })
  const result = h.run(core, target)

  assert.match(result.output, /Stacks detectadas: .*react/)
  assert.match(result.output, /Stacks detectadas: .*nestjs/)
  assert.ok(h.exists(target, '.claude/rules/react-standard.md'))
  assert.ok(h.exists(target, '.claude/rules/nestjs-standard.md'))
})

test('a detecção ignora node_modules e pastas ocultas', () => {
  const core = stackCore()
  const target = h.makeTarget({
    'node_modules/react/package.json': JSON.stringify({ dependencies: { react: '18' } }),
    '.cache/package.json': JSON.stringify({ dependencies: { react: '18' } })
  })
  const result = h.run(core, target)

  assert.match(result.output, /Stacks detectadas: nenhuma/)
})

test('stack sem conteúdo no catálogo não é detectada', () => {
  const core = stackCore()
  const target = h.makeTarget({ 'composer.json': JSON.stringify({ require: { 'laravel/framework': '11' } }) })
  const result = h.run(core, target)

  assert.match(result.output, /Stacks detectadas: nenhuma/)
})

test('o perfil manual prevalece sobre a detecção', () => {
  const core = stackCore()
  const target = h.makeTarget({ 'package.json': JSON.stringify({ dependencies: { react: '18' } }) })
  h.run(core, target, '--profile', 'minimal')

  assert.ok(!h.exists(target, '.claude/rules/react-standard.md'))
})

test('rodar de novo com tudo em dia não muda nada', () => {
  const core = basicCore()
  const target = h.makeTarget()
  h.run(core, target)
  const before = h.snapshot(target)
  const second = h.run(core, target)

  assert.equal(second.status, 0)
  assert.match(second.output, /Tudo em dia, nada mudou/)
  assert.equal(h.snapshot(target), before)
})

test('arquivo do usuário com o mesmo nome não é apagado nem sobrescrito', () => {
  const core = basicCore()
  const target = h.makeTarget({ '.claude/agents/qa.md': 'meu qa\n' })
  const result = h.run(core, target)

  assert.equal(h.read(target, '.claude/agents/qa.md'), 'meu qa\n')
  assert.match(result.output, /já existe um arquivo seu.*O claude-kit tem uma versão disponível/)
  assert.match(result.output, /Deixados como estavam:\n\s+\.claude\/agents\/qa\.md/)
  const lock = JSON.parse(h.read(target, '.claude/claude-kit.lock.json'))
  assert.ok(!('.claude/agents/qa.md' in lock.files))
})

test('arquivo do usuário com outro nome nunca é tocado', () => {
  const core = basicCore()
  const target = h.makeTarget({
    '.claude/agents/meu-agente.md': 'meu\n',
    '.claude/rules/minha-regra.md': 'minha\n',
    '.claude/skills/minha-skill/SKILL.md': 'skill\n'
  })
  h.run(core, target)
  h.run(core, target, '--profile', 'minimal')

  assert.equal(h.read(target, '.claude/agents/meu-agente.md'), 'meu\n')
  assert.equal(h.read(target, '.claude/rules/minha-regra.md'), 'minha\n')
  assert.equal(h.read(target, '.claude/skills/minha-skill/SKILL.md'), 'skill\n')
})

test('arquivo idêntico ao do repositório passa a ser acompanhado sem mudar', () => {
  const core = basicCore()
  const target = h.makeTarget({ '.claude/agents/qa.md': agent('qa') })
  const result = h.run(core, target)

  assert.match(result.output, /passaram a ser acompanhados\):\n\s+\.claude\/agents\/qa\.md/)
  const lock = JSON.parse(h.read(target, '.claude/claude-kit.lock.json'))
  assert.ok('.claude/agents/qa.md' in lock.files)
})

test('arquivo instalado e sem alterações é atualizado quando o repositório muda', () => {
  const core = basicCore()
  const target = h.makeTarget()
  h.run(core, target)
  h.setContent(core, 'agents/qa.md', agent('qa', ' novo'))
  const result = h.run(core, target)

  assert.equal(h.read(target, '.claude/agents/qa.md'), agent('qa', ' novo'))
  assert.match(result.output, /Atualizados:\n\s+\.claude\/agents\/qa\.md/)
})

test('arquivo editado depois da instalação não é sobrescrito e o aviso diz se há versão nova', () => {
  const core = basicCore()
  const target = h.makeTarget()
  h.run(core, target)
  h.run(core, target)
  const edited = `${agent('qa')}minha edição\n`
  fs.writeFileSync(path.join(target, '.claude/agents/qa.md'), edited)

  const semNovidade = h.run(core, target)
  assert.equal(h.read(target, '.claude/agents/qa.md'), edited)
  assert.match(semNovidade.output, /você editou este arquivo/)
  assert.doesNotMatch(semNovidade.output, /versão nova disponível/)

  h.setContent(core, 'agents/qa.md', agent('qa', ' novo'))
  const comNovidade = h.run(core, target)
  assert.equal(h.read(target, '.claude/agents/qa.md'), edited)
  assert.match(comNovidade.output, /versão nova disponível no claude-kit/)
})

test('arquivo editado que ficou igual ao do repositório volta a ser acompanhado', () => {
  const core = basicCore()
  const target = h.makeTarget()
  h.run(core, target)
  fs.writeFileSync(path.join(target, '.claude/agents/qa.md'), 'editado\n')
  h.setContent(core, 'agents/qa.md', 'editado\n')
  const result = h.run(core, target)

  assert.equal(result.status, 0)
  assert.doesNotMatch(result.output, /Avisos/)
  const lock = JSON.parse(h.read(target, '.claude/claude-kit.lock.json'))
  assert.equal(lock.files['.claude/agents/qa.md'].hash.length, 64)
})

test('item retirado do repositório é removido do projeto se estiver sem alterações', () => {
  const core = basicCore()
  const target = h.makeTarget()
  h.run(core, target)
  h.removeItem(core, 'agents', 'designer')
  const result = h.run(core, target)

  assert.ok(!h.exists(target, '.claude/agents/designer.md'))
  assert.match(result.output, /Removidos:\n\s+\.claude\/agents\/designer\.md/)
  const lock = JSON.parse(h.read(target, '.claude/claude-kit.lock.json'))
  assert.ok(!('.claude/agents/designer.md' in lock.files))
})

test('item retirado do repositório é mantido se o usuário o editou', () => {
  const core = basicCore()
  const target = h.makeTarget()
  h.run(core, target)
  fs.writeFileSync(path.join(target, '.claude/agents/designer.md'), 'editado\n')
  h.removeItem(core, 'agents', 'designer')
  const result = h.run(core, target)

  assert.equal(h.read(target, '.claude/agents/designer.md'), 'editado\n')
  assert.match(result.output, /saiu do claude-kit, mas você editou este arquivo/)
})

test('item que sai do que se aplica ao projeto é removido só se estiver sem alterações', () => {
  const core = stackCore()
  const target = h.makeTarget({ 'package.json': JSON.stringify({ dependencies: { react: '18' } }) })
  h.run(core, target)
  assert.ok(h.exists(target, '.claude/rules/react-standard.md'))

  fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({ dependencies: {} }))
  h.run(core, target)
  assert.ok(!h.exists(target, '.claude/rules/react-standard.md'))
})

test('--force sobrescreve arquivos em conflito e lista cada um', () => {
  const core = basicCore()
  const target = h.makeTarget({ '.claude/agents/qa.md': 'meu qa\n' })
  h.run(core, target)
  h.run(core, target)
  fs.writeFileSync(path.join(target, '.claude/agents/designer.md'), 'editado\n')

  const result = h.run(core, target, '--force')

  assert.equal(h.read(target, '.claude/agents/qa.md'), agent('qa'))
  assert.equal(h.read(target, '.claude/agents/designer.md'), agent('designer'))
  assert.match(result.output, /Sobrescritos \(--force\):/)
  assert.match(result.output, /\.claude\/agents\/qa\.md/)
  assert.match(result.output, /\.claude\/agents\/designer\.md/)
  assert.equal(h.run(core, target).output.includes('Tudo em dia, nada mudou.'), true)
})

test('--force não toca em arquivos que o repositório não entrega', () => {
  const core = basicCore()
  const target = h.makeTarget({ '.claude/agents/meu-agente.md': 'meu\n' })
  h.run(core, target, '--force')

  assert.equal(h.read(target, '.claude/agents/meu-agente.md'), 'meu\n')
})

test('--force em arquivo desatualizado e sem alterações aparece como atualizado', () => {
  const core = basicCore()
  const target = h.makeTarget()
  h.run(core, target)
  h.setContent(core, 'agents/qa.md', agent('qa', ' novo'))
  const result = h.run(core, target, '--force')

  assert.match(result.output, /Atualizados:\n\s+\.claude\/agents\/qa\.md/)
  assert.doesNotMatch(result.output, /Sobrescritos/)
})

test('skills são copiadas por arquivo e removidas com as pastas vazias', () => {
  const core = h.makeCore({
    items: [{ group: 'skills', name: 'demo', files: { 'SKILL.md': 'a\n', 'sub/extra.md': 'b\n' } }]
  })
  const target = h.makeTarget()
  h.run(core, target)

  assert.equal(h.read(target, '.claude/skills/demo/SKILL.md'), 'a\n')
  assert.equal(h.read(target, '.claude/skills/demo/sub/extra.md'), 'b\n')

  h.removeItem(core, 'skills', 'demo')
  h.run(core, target)
  assert.ok(!h.exists(target, '.claude/skills'))
})

test('libera a pasta de worktrees em settings.local.json sem duplicar nas execuções seguintes', () => {
  const core = basicCore()
  const target = h.makeTarget()
  h.run(core, target)
  h.run(core, target)

  const settings = JSON.parse(h.read(target, '.claude/settings.local.json'))
  const expected = `${target}-worktrees`
  assert.deepEqual(settings.permissions.additionalDirectories, [expected])
  assert.deepEqual(settings.permissions.allow, [`Edit(/${expected}/**)`])
})

test('preserva as configurações que o usuário já tinha em settings.local.json', () => {
  const core = basicCore()
  const target = h.makeTarget({
    '.claude/settings.local.json': JSON.stringify({ permissions: { allow: ['Bash(ls)'], additionalDirectories: ['/x'] }, env: { A: '1' } })
  })
  h.run(core, target)

  const settings = JSON.parse(h.read(target, '.claude/settings.local.json'))
  assert.ok(settings.permissions.allow.includes('Bash(ls)'))
  assert.ok(settings.permissions.additionalDirectories.includes('/x'))
  assert.equal(settings.env.A, '1')
})

test('settings.local.json inválido não é sobrescrito', () => {
  const core = basicCore()
  const target = h.makeTarget({ '.claude/settings.local.json': '{ quebrado' })
  const result = h.run(core, target)

  assert.equal(h.read(target, '.claude/settings.local.json'), '{ quebrado')
  assert.match(result.output, /não é um JSON válido/)
})

test('exclui a memória do time do git quando o projeto é um repositório', () => {
  const core = basicCore()
  const target = h.makeTarget({ '.git/HEAD': 'ref: refs/heads/main\n' })
  h.run(core, target)
  h.run(core, target)

  const exclude = h.read(target, '.git/info/exclude')
  assert.equal(exclude.split('\n').filter((line) => line === '.claude/team-memory/').length, 1)
})

test('--check aprova catálogo e perfis consistentes', () => {
  const core = basicCore({ profiles: { ok: { agents: ['orchestrator'], rules: ['commit-standard'] } } })
  const result = h.run(core, null, '--check')

  assert.equal(result.status, 0)
  assert.match(result.output, /consistentes/)
})

test('--check reprova perfil que cita item fora do catálogo e caminho que não existe', () => {
  const core = basicCore({ profiles: { ruim: { agents: ['fantasma'], rules: [] } } })
  fs.rmSync(path.join(core, 'agents', 'qa.md'))
  const result = h.run(core, null, '--check')

  assert.equal(result.status, 1)
  assert.match(result.output, /agents\/fantasma não está no catalog\.json/)
  assert.match(result.output, /agents\/qa: agents\/qa\.md não existe/)
})

test('--check reprova item que se aplica a uma stack desconhecida', () => {
  const core = h.makeCore({
    items: [{ group: 'rules', name: 'x', applies: ['cobol'], files: '# x\n' }],
    profiles: {}
  })
  const result = h.run(core, null, '--check')

  assert.equal(result.status, 1)
  assert.match(result.output, /stack "cobol" não está em "stacks"/)
})

test('o catálogo e os perfis do repositório estão consistentes', () => {
  const { spawnSync } = require('node:child_process')
  const result = spawnSync('node', [path.join(h.repoRoot, 'bin', 'ai-sync.js'), '--check'], { encoding: 'utf8' })

  assert.equal(result.status, 0, result.stdout + result.stderr)
})

test('cada perfil do repositório aplica em um projeto limpo e roda de novo sem mudar nada', () => {
  const { spawnSync } = require('node:child_process')
  const profiles = fs.readdirSync(path.join(h.repoRoot, 'profiles')).map((f) => f.replace('.json', ''))
  const script = path.join(h.repoRoot, 'bin', 'ai-sync.js')

  for (const profile of [null, ...profiles]) {
    const target = h.makeTarget()
    const args = profile ? ['--profile', profile] : []
    const first = spawnSync('node', [script, target, ...args], { encoding: 'utf8' })
    assert.equal(first.status, 0, first.stderr)
    const before = h.snapshot(target)
    const second = spawnSync('node', [script, target, ...args], { encoding: 'utf8' })
    assert.equal(second.status, 0, second.stderr)
    assert.equal(h.snapshot(target), before)
  }
})

test('avisa para abrir uma sessão nova quando agentes são instalados, atualizados ou removidos', () => {
  const core = basicCore()
  const target = h.makeTarget()
  const first = h.run(core, target)
  assert.match(first.output, /abra uma sessão nova do Claude/)

  const idle = h.run(core, target)
  assert.doesNotMatch(idle.output, /sessão nova/)

  h.setContent(core, 'agents/qa.md', agent('qa', ' novo'))
  assert.match(h.run(core, target).output, /abra uma sessão nova do Claude/)

  h.removeItem(core, 'agents', 'designer')
  assert.match(h.run(core, target).output, /abra uma sessão nova do Claude/)
})

test('não manda abrir sessão nova quando só regras mudam', () => {
  const core = basicCore()
  const target = h.makeTarget()
  h.run(core, target)
  h.setContent(core, 'rules/commit-standard.md', '# Commits\n\nmais uma linha\n')
  const result = h.run(core, target)

  assert.match(result.output, /Atualizados:\n\s+\.claude\/rules\/commit-standard\.md/)
  assert.doesNotMatch(result.output, /sessão nova/)
})

const OLD_LOCK = '.claude/claude-core.lock.json'
const NEW_LOCK = '.claude/claude-kit.lock.json'

function withOldLock(core, target) {
  h.run(core, target)
  fs.renameSync(path.join(target, NEW_LOCK), path.join(target, OLD_LOCK))
}

test('primeira execução grava só o registro com o nome novo', () => {
  const target = h.makeTarget()
  h.run(basicCore(), target)

  assert.ok(h.exists(target, NEW_LOCK))
  assert.ok(!h.exists(target, OLD_LOCK))
})

test('registro antigo é migrado para o novo com tudo o que estava registrado', () => {
  const core = h.makeCore({
    items: [
      { group: 'agents', name: 'qa', files: agent('qa') },
      { group: 'settings', name: 'base', files: { permissions: { allow: ['Bash(ls)'] } } }
    ],
    profiles: { minimal: { agents: ['qa'], rules: [], settings: ['base'] } }
  })
  const target = h.makeTarget()
  h.run(core, target, '--profile', 'minimal')
  const before = JSON.parse(h.read(target, NEW_LOCK))
  fs.renameSync(path.join(target, NEW_LOCK), path.join(target, OLD_LOCK))

  const result = h.run(core, target, '--profile', 'minimal')

  assert.equal(result.status, 0)
  assert.ok(!h.exists(target, OLD_LOCK))
  assert.deepEqual(JSON.parse(h.read(target, NEW_LOCK)), before)
  assert.ok(before.settings.applied.length > 0)
})

test('migração do registro mostra a mesma saída de um registro já com o nome novo', () => {
  const core = basicCore()
  const migrated = h.makeTarget()
  withOldLock(core, migrated)
  h.setContent(core, 'agents/qa.md', agent('qa', ' novo'))
  const current = h.makeTarget()
  h.run(basicCore(), current)
  const migratedResult = h.run(core, migrated)
  const currentResult = h.run(core, current)

  assert.equal(migratedResult.output.replaceAll(migrated, 'T'), currentResult.output.replaceAll(current, 'T'))
})

test('com os dois registros, usa só o novo e remove o antigo', () => {
  const core = basicCore()
  const target = h.makeTarget()
  h.run(core, target)
  fs.writeFileSync(path.join(target, OLD_LOCK), JSON.stringify({ files: { '.claude/agents/fantasma.md': { hash: 'x', version: '0' } } }))
  const before = h.read(target, NEW_LOCK)

  h.run(core, target)

  assert.ok(!h.exists(target, OLD_LOCK))
  assert.equal(h.read(target, NEW_LOCK), before)
  assert.ok(!h.read(target, NEW_LOCK).includes('fantasma'))
})

test('registro antigo inválido para com erro e não copia nem grava nada', () => {
  const core = basicCore()
  const target = h.makeTarget({ [OLD_LOCK]: '{quebrado' })
  const result = h.run(core, target)

  assert.notEqual(result.status, 0)
  assert.match(result.output, /registro antigo.*não pôde ser lido/)
  assert.equal(h.read(target, OLD_LOCK), '{quebrado')
  assert.ok(!h.exists(target, NEW_LOCK))
  assert.ok(!h.exists(target, '.claude/agents/qa.md'))
})

test('migração mantém o arquivo editado pelo usuário e avisa', () => {
  const core = basicCore()
  const target = h.makeTarget()
  withOldLock(core, target)
  fs.writeFileSync(path.join(target, '.claude/agents/qa.md'), 'meu qa\n')
  h.setContent(core, 'agents/qa.md', agent('qa', ' novo'))

  const result = h.run(core, target)

  assert.equal(h.read(target, '.claude/agents/qa.md'), 'meu qa\n')
  assert.match(result.output, /você editou este arquivo/)
})

test('migração atualiza arquivo instalado sem alterações quando há versão nova', () => {
  const core = basicCore()
  const target = h.makeTarget()
  withOldLock(core, target)
  h.setContent(core, 'agents/qa.md', agent('qa', ' novo'))

  const result = h.run(core, target)

  assert.match(h.read(target, '.claude/agents/qa.md'), /novo/)
  assert.match(result.output, /Atualizados/)
})

test('migração deixa intactos os outros arquivos da pasta .claude', () => {
  const core = basicCore()
  const target = h.makeTarget({ '.claude/meu-arquivo.txt': 'meu\n', '.claude/agents/meu-agente.md': 'meu\n' })
  withOldLock(core, target)
  h.run(core, target)

  assert.equal(h.read(target, '.claude/meu-arquivo.txt'), 'meu\n')
  assert.equal(h.read(target, '.claude/agents/meu-agente.md'), 'meu\n')
})
