const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const h = require('./helpers')

afterEach(h.cleanup)

const script = path.join(h.repoRoot, 'bin', 'ai-sync.js')
const catalog = JSON.parse(fs.readFileSync(path.join(h.repoRoot, 'catalog.json'), 'utf8'))
const general = ['code-standard', 'testing-standard', 'security-standard', 'review-standard', 'commit-standard', 'git-standard', 'feedback-standard', 'pull-request-standard', 'issue-standard']
const stackRules = {
  react: ['react-standard', 'style-standard', 'react-organization-standard', 'frontend-testing-standard', 'accessibility-standard'],
  nestjs: ['nestjs-standard'],
  laravel: ['laravel-standard'],
  adonisjs: ['adonisjs-standard']
}

function sync(target, ...args) {
  const result = spawnSync('node', [script, target, ...args], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}

function rulesOf(target) {
  const dir = path.join(target, '.claude', 'rules')
  return fs.existsSync(dir) ? fs.readdirSync(dir).map((f) => f.replace('.md', '')).sort() : []
}

const projects = {
  react: { 'package.json': JSON.stringify({ dependencies: { react: '18' } }) },
  nestjs: { 'package.json': JSON.stringify({ dependencies: { '@nestjs/core': '10' } }) },
  laravel: { 'composer.json': JSON.stringify({ require: { 'laravel/framework': '11' } }) },
  adonisjs: { 'package.json': JSON.stringify({ dependencies: { '@adonisjs/core': '6' } }) }
}

for (const [stack, files] of Object.entries(projects)) {
  test(`projeto ${stack} recebe os padrões gerais e só os de ${stack}`, () => {
    const target = h.makeTarget(files)
    const output = sync(target)

    assert.match(output, new RegExp(`Stacks detectadas: ${stack}$`, 'm'))
    assert.deepEqual(rulesOf(target), [...general, ...stackRules[stack]].sort())
  })
}

test('projeto com React e NestJS recebe os padrões das duas stacks e de mais nenhuma', () => {
  const target = h.makeTarget({
    'web/package.json': projects.react['package.json'],
    'api/package.json': projects.nestjs['package.json']
  })
  sync(target)

  assert.deepEqual(rulesOf(target), [...general, ...stackRules.react, ...stackRules.nestjs].sort())
})

test('projeto sem stack conhecida recebe só os padrões gerais', () => {
  const target = h.makeTarget()
  sync(target)

  assert.deepEqual(rulesOf(target), [...general].sort())
})

test('padrão editado no projeto não é apagado nem sobrescrito pela próxima sincronização', () => {
  const target = h.makeTarget(projects.react)
  sync(target)
  const file = path.join(target, '.claude', 'rules', 'react-standard.md')
  const edited = `${fs.readFileSync(file, 'utf8')}- Regra do meu projeto.\n`
  fs.writeFileSync(file, edited)
  const output = sync(target)

  assert.equal(fs.readFileSync(file, 'utf8'), edited)
  assert.match(output, /react-standard\.md: você editou este arquivo/)
})

test('cada padrão de stack se limita aos arquivos da stack e todo padrão é curto', () => {
  for (const [name, item] of Object.entries(catalog.rules)) {
    const text = fs.readFileSync(path.join(h.repoRoot, item.path), 'utf8')
    const lines = text.split('\n').length
    assert.ok(lines <= 60, `${name} tem ${lines} linhas`)
    if (!item.applies.includes('all')) {
      assert.match(text, /^---\npaths:\n/, `${name} deve declarar paths`)
    }
  }
})

const generalSkills = ['bug-investigation', 'code-review', 'commit-message', 'create-pull-request', 'documentation', 'team-setup']
const stackSkills = { react: ['react-component', 'accessibility-audit'], nestjs: ['nestjs-module'] }

function skillsOf(target) {
  const dir = path.join(target, '.claude', 'skills')
  return fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []
}

for (const [stack, files] of Object.entries(projects)) {
  test(`projeto ${stack} recebe as skills gerais e só as da própria stack`, () => {
    const target = h.makeTarget(files)
    sync(target)
    const expected = stackSkills[stack] ? [...generalSkills, ...stackSkills[stack]] : generalSkills

    assert.deepEqual(skillsOf(target), [...expected].sort())
    for (const skill of expected) assert.ok(h.exists(target, `.claude/skills/${skill}/SKILL.md`))
  })
}

test('projeto com React e NestJS recebe as skills das duas stacks', () => {
  const target = h.makeTarget({
    'web/package.json': projects.react['package.json'],
    'api/package.json': projects.nestjs['package.json']
  })
  sync(target)

  assert.deepEqual(skillsOf(target), [...generalSkills, 'react-component', 'accessibility-audit', 'nestjs-module'].sort())
})

test('skill editada no projeto não é sobrescrita e uma skill do usuário nunca é tocada', () => {
  const target = h.makeTarget({
    ...projects.react,
    '.claude/skills/minha-skill/SKILL.md': '---\nname: minha-skill\ndescription: x\n---\n'
  })
  sync(target)
  const file = path.join(target, '.claude', 'skills', 'code-review', 'SKILL.md')
  const edited = `${fs.readFileSync(file, 'utf8')}\nMinha regra.\n`
  fs.writeFileSync(file, edited)
  const output = sync(target)

  assert.equal(fs.readFileSync(file, 'utf8'), edited)
  assert.match(output, /code-review\/SKILL\.md: você editou este arquivo/)
  assert.ok(h.exists(target, '.claude/skills/minha-skill/SKILL.md'))
})

test('cada skill do catálogo diz quando usar e o que entrega', () => {
  for (const [name, item] of Object.entries(catalog.skills)) {
    const text = fs.readFileSync(path.join(h.repoRoot, item.path, 'SKILL.md'), 'utf8')
    assert.match(text, /description: .*(Use quando|Use para)/, `${name} deve dizer quando usar`)
    assert.match(text, /Entrega:/, `${name} deve dizer o que entrega`)
  }
})
