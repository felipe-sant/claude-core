const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { replaceVersionPrBoilerplate, projectPhrase } = require('../scripts/replace-version-pr-boilerplate')
const h = require('./helpers')

afterEach(h.cleanup)

const defaultParagraph =
  "This PR was opened by the [Changesets release](https://github.com/changesets/action) GitHub action. When you're ready to do a release, you can merge this and publish to npm yourself or [setup this action to publish automatically](https://github.com/changesets/action#with-publishing). If you're not ready to do a release yet, that's fine, whenever you add more changesets to main, this PR will be updated."
const releases = '# Releases\n## @felipe-sant/claude-kit@1.0.0\n\n### Major Changes\n\n- abc: Publica o pacote.'
const scriptPath = path.join(h.repoRoot, 'scripts', 'prepare-version-pr-body.js')

function runScript(args, env = {}) {
  const result = spawnSync('node', [scriptPath, ...args], { encoding: 'utf8', env: { ...process.env, GITHUB_OUTPUT: '', ...env } })
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

test('troca o parágrafo padrão em inglês pelo texto em português', () => {
  const result = replaceVersionPrBoilerplate(`${defaultParagraph}\n\n${releases}`)
  assert.equal(result, `${projectPhrase}\n\n${releases}`)
  assert.doesNotMatch(result, /This PR was opened/)
})

test('o texto em português cita a publicação, a tag e o Release', () => {
  assert.match(projectPhrase, /^Pull request de versão aberto pela automação de notas de mudança\./)
  assert.match(projectPhrase, /publica a versão no npm e cria a tag e o Release/)
})

test('o corpo sem o parágrafo padrão não muda', () => {
  assert.equal(replaceVersionPrBoilerplate(releases), releases)
})

test('o corpo já em português não muda', () => {
  const body = `${projectPhrase}\n\n${releases}`
  assert.equal(replaceVersionPrBoilerplate(body), body)
})

test('o script reescreve o arquivo e informa changed=true', () => {
  const dir = h.tempDir('body')
  const file = path.join(dir, 'body.md')
  fs.writeFileSync(file, `${defaultParagraph}\n\n${releases}`)
  const result = runScript([file])
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.trim(), 'changed=true')
  assert.equal(fs.readFileSync(file, 'utf8'), `${projectPhrase}\n\n${releases}`)
})

test('o script informa changed=false quando o corpo não muda', () => {
  const dir = h.tempDir('body')
  const file = path.join(dir, 'body.md')
  fs.writeFileSync(file, releases)
  const result = runScript([file])
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.trim(), 'changed=false')
  assert.equal(fs.readFileSync(file, 'utf8'), releases)
})

test('o script grava a saída no arquivo do GITHUB_OUTPUT quando ele existe', () => {
  const dir = h.tempDir('body')
  const file = path.join(dir, 'body.md')
  const output = path.join(dir, 'output.txt')
  fs.writeFileSync(file, defaultParagraph)
  const result = runScript([file], { GITHUB_OUTPUT: output })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(fs.readFileSync(output, 'utf8'), 'changed=true\n')
  assert.equal(result.stdout, '')
})

test('o script recusa a chamada sem arquivo, com mensagem em português', () => {
  const result = runScript([])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Informe o arquivo com o corpo do PR de versão\./)
})
