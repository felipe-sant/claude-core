const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const h = require('./helpers')

const workflow = fs.readFileSync(path.join(h.repoRoot, '.github', 'workflows', 'release.yml'), 'utf8')

function stepBlock(marker) {
  const start = workflow.indexOf(marker)
  assert.notEqual(start, -1, `passo não encontrado: ${marker}`)
  const next = workflow.indexOf('\n      - ', start + marker.length)
  return workflow.slice(start, next === -1 ? undefined : next)
}

test('a publicação roda a cada entrada na main', () => {
  assert.match(workflow, /^on:\n {2}push:\n {4}branches: \[main\]\n/m)
})

test('a concorrência é única e não cancela a execução em andamento', () => {
  assert.match(workflow, /^concurrency:\n {2}group: release\n {2}cancel-in-progress: false$/m)
})

test('o job pode escrever conteúdo e pedir o token de identidade, e nada mais', () => {
  assert.match(workflow, /^ {4}permissions:\n {6}contents: write\n {6}id-token: write$/m)
  assert.doesNotMatch(workflow, /pull-requests|issues: write|packages: write/)
})

test('não há token do npm, NODE_AUTH_TOKEN nem registry-url', () => {
  assert.doesNotMatch(workflow, /NPM_TOKEN|NODE_AUTH_TOKEN|registry-url|secrets\./)
})

test('instala o npm 11.5.1 ou mais novo antes de publicar', () => {
  assert.match(workflow, /run: npm install -g npm@\^11\.5\.1$/m)
  assert.ok(workflow.indexOf('npm install -g npm@^11.5.1') < workflow.indexOf('npm publish'))
})

test('o checkout busca o histórico e as tags', () => {
  assert.match(workflow, /uses: actions\/checkout@v7\n {8}with:\n {10}fetch-depth: 0\n {10}fetch-tags: true\n/)
  assert.match(workflow, /uses: actions\/setup-node@v7\n {8}with:\n {10}node-version: 22\n {10}cache: npm\n/)
})

test('a preparação roda o script de release e expõe as saídas', () => {
  const block = stepBlock('- id: prepare')
  assert.match(block, /run: node scripts\/prepare-release\.js/)
})

test('publica só quando a saída publish é verdadeira', () => {
  const block = stepBlock("- if: steps.prepare.outputs.publish == 'true'")
  assert.match(block, /run: npm publish --access public$/m)
})

test('cria a tag e o Release só quando a saída release é verdadeira', () => {
  const block = stepBlock("- if: steps.prepare.outputs.release == 'true'")
  assert.match(block, /run: gh release create "\$TAG" --target "\$TARGET_SHA" --title "\$TAG" --notes-file "\$NOTES_FILE"$/m)
  assert.match(block, /GH_TOKEN: \$\{\{ github\.token \}\}/)
  assert.match(block, /TAG: \$\{\{ steps\.prepare\.outputs\.tag \}\}/)
  assert.match(block, /NOTES_FILE: \$\{\{ steps\.prepare\.outputs\.notes-file \}\}/)
  assert.match(block, /TARGET_SHA: \$\{\{ github\.sha \}\}/)
})

test('publica antes de criar a tag', () => {
  assert.ok(workflow.indexOf('npm publish') < workflow.indexOf('gh release create'))
})

test('nenhum comando interpola expressão do GitHub diretamente', () => {
  const runLines = workflow.split('\n').filter((line) => /^\s+(- )?run:/.test(line))
  assert.ok(runLines.length > 0)
  for (const line of runLines) assert.doesNotMatch(line, /\$\{\{/, line)
})
