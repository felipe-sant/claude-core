const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { readWorkflow, jobBlock } = require('./issue-workflow-helpers')

const agentText = readWorkflow('issue-claude-agent.yml')
const sizeSetText = readWorkflow('issue-size-set.yml')

function finalCheckStep(block) {
  const start = block.indexOf('name: Conferência final')
  const rest = block.slice(start)
  const end = rest.search(/\n {6}- name:|\n {6}- id:/)
  return end === -1 ? rest : rest.slice(0, end)
}

function runScript(step) {
  const marker = 'run: |\n'
  return step
    .slice(step.indexOf(marker) + marker.length)
    .split('\n')
    .map((line) => line.replace(/^ {10}/, ''))
    .join('\n')
}

const agentStep = finalCheckStep(jobBlock(agentText, 'agent'))
const sizeSetStep = finalCheckStep(jobBlock(sizeSetText, 'classify'))

const MAIN_BLOCK = /main_after=[\s\S]*?\n {10}esac\n/

test('as duas conferências comparam a principal pelo GitHub e aceitam só igual ou à frente', () => {
  for (const step of [agentStep, sizeSetStep]) {
    assert.match(step, /compare\/\$main_before\.\.\.\$main_after/)
    assert.match(step, /identical\|ahead\) ;;/)
    assert.match(step, /fail "A branch principal perdeu o ponto em que estava antes da execução/)
    assert.doesNotMatch(step, /A branch principal mudou durante a execução/)
  }
})

test('a conferência da principal é a mesma nas duas automações', () => {
  assert.equal(agentStep.match(MAIN_BLOCK)[0], sizeSetStep.match(MAIN_BLOCK)[0])
})

test('a conferência da principal não usa o autor das mudanças', () => {
  for (const step of [agentStep, sizeSetStep]) {
    assert.doesNotMatch(step.match(MAIN_BLOCK)[0], /author|committer|user\.login/)
  }
})

test('a classificação não reprova mais a lista inteira de branches', () => {
  assert.doesNotMatch(sizeSetStep, /A lista de branches mudou durante a execução/)
  assert.doesNotMatch(sizeSetStep, /cmp -s/)
  assert.match(sizeSetStep, /fail "A branch \$\{ref#refs\/heads\/\} perdeu o ponto em que estava antes da execução/)
})

const EMPTY_STATE = 'none'

function runSizeSetCheck({ mainBefore, mainAfter, headsBefore, headsAfter, compare }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'final-check-'))
  const bin = path.join(dir, 'bin')
  const check = path.join(dir, 'check')
  fs.mkdirSync(bin)
  fs.mkdirSync(check)
  fs.writeFileSync(path.join(check, 'main'), `${mainBefore}\n`)
  fs.writeFileSync(path.join(check, 'branches'), headsBefore.map(([sha, name]) => `${sha}\trefs/heads/${name}\n`).join(''))
  fs.writeFileSync(path.join(check, 'pulls'), '0\n')
  fs.writeFileSync(path.join(dir, 'heads-after'), headsAfter.map(([sha, name]) => `${sha}\trefs/heads/${name}\n`).join(''))
  fs.writeFileSync(path.join(dir, 'compare.json'), JSON.stringify(compare))
  fs.writeFileSync(
    path.join(bin, 'git'),
    ['#!/bin/bash', 'if [ "$3" = "refs/heads/main" ]; then', `  printf '%s\\trefs/heads/main\\n' "${mainAfter}"`, 'else', `  cat "${path.join(dir, 'heads-after')}"`, 'fi', ''].join('\n'),
    { mode: 0o755 }
  )
  fs.writeFileSync(
    path.join(bin, 'gh'),
    [
      '#!/bin/bash',
      'case "$2" in',
      '  repos/*/compare/*)',
      '    range="${2##*/compare/}"',
      `    echo "$range" >> "${path.join(dir, 'compare-calls')}"`,
      `    node -e 'const m = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); const s = m[process.argv[2]]; if (!s) process.exit(1); console.log(s)' "${path.join(dir, 'compare.json')}" "$range"`,
      '    ;;',
      '  *) echo 0 ;;',
      'esac',
      ''
    ].join('\n'),
    { mode: 0o755 }
  )
  const script = runScript(sizeSetStep)
  const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
    encoding: 'utf8',
    env: {
      PATH: `${bin}:${process.env.PATH}`,
      CHECK_DIR: check,
      GITHUB_REPOSITORY: 'o/r',
      PULL_REQUEST_LINE: 'linha',
      CLASSIFICATION_MARK: 'marca',
      CLASSIFY: '',
      CLAUDE_OUTCOME: 'success',
      GH_TOKEN: EMPTY_STATE
    }
  })
  const callsFile = path.join(dir, 'compare-calls')
  result.compareCalls = fs.existsSync(callsFile) ? fs.readFileSync(callsFile, 'utf8').split('\n').filter((line) => line !== '') : []
  return result
}

const base = {
  mainBefore: 'a1',
  mainAfter: 'a1',
  headsBefore: [['a1', 'main'], ['b1', 'fix/1-x']],
  headsAfter: [['a1', 'main'], ['b1', 'fix/1-x']],
  compare: {}
}

test('nada muda: a conferência aprova', () => {
  const result = runSizeSetCheck(base)
  assert.equal(result.status, 0, result.stdout + result.stderr)
})

test('a principal avança por pull request juntado: aprova', () => {
  const result = runSizeSetCheck({ ...base, mainAfter: 'a2', headsAfter: [['a2', 'main'], ['b1', 'fix/1-x']], compare: { 'a1...a2': 'ahead' } })
  assert.equal(result.status, 0, result.stdout + result.stderr)
})

test('a principal perde o ponto de antes: reprova dizendo isso', () => {
  const result = runSizeSetCheck({ ...base, mainAfter: 'a2', headsAfter: [['a2', 'main'], ['b1', 'fix/1-x']], compare: { 'a1...a2': 'diverged' } })
  assert.notEqual(result.status, 0)
  assert.match(result.stdout, /::error::A branch principal perdeu o ponto em que estava antes da execução/)
})

test('a comparação da principal falha: reprova sem aprovar em silêncio', () => {
  const result = runSizeSetCheck({ ...base, mainAfter: 'a2', headsAfter: [['a2', 'main'], ['b1', 'fix/1-x']], compare: {} })
  assert.notEqual(result.status, 0)
  assert.match(result.stdout, /::error::/)
})

test('o dono apaga uma branch e cria outra: aprova', () => {
  const result = runSizeSetCheck({ ...base, headsAfter: [['a1', 'main'], ['c1', 'feat/2-y']] })
  assert.equal(result.status, 0, result.stdout + result.stderr)
})

test('uma branch que existia só avança: aprova', () => {
  const result = runSizeSetCheck({ ...base, headsAfter: [['a1', 'main'], ['b2', 'fix/1-x']], compare: { 'b1...b2': 'ahead' } })
  assert.equal(result.status, 0, result.stdout + result.stderr)
})

test('uma branch que existia perde o ponto de antes: reprova citando a branch', () => {
  const result = runSizeSetCheck({ ...base, headsAfter: [['a1', 'main'], ['b2', 'fix/1-x']], compare: { 'b1...b2': 'diverged' } })
  assert.notEqual(result.status, 0)
  assert.match(result.stdout, /::error::A branch fix\/1-x perdeu o ponto em que estava antes da execução/)
})

test('a consulta da comparação de uma branch falha: reprova citando a branch', () => {
  const result = runSizeSetCheck({ ...base, headsAfter: [['a1', 'main'], ['b2', 'fix/1-x']], compare: {} })
  assert.notEqual(result.status, 0)
  assert.match(result.stdout, /::error::A branch fix\/1-x perdeu o ponto em que estava antes da execução, ou a comparação com o GitHub falhou/)
})

test('uma branch que ficou para trás: reprova citando a branch', () => {
  const result = runSizeSetCheck({ ...base, headsAfter: [['a1', 'main'], ['b0', 'fix/1-x']], compare: { 'b1...b0': 'behind' } })
  assert.notEqual(result.status, 0)
  assert.match(result.stdout, /::error::A branch fix\/1-x perdeu o ponto/)
})

test('a principal é comparada uma vez só e fica fora da conferência das branches', () => {
  const result = runSizeSetCheck({ ...base, mainAfter: 'a2', headsAfter: [['a2', 'main'], ['b1', 'fix/1-x']], compare: { 'a1...a2': 'ahead' } })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(result.compareCalls, ['a1...a2'])
})
