const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const h = require('./helpers')

const readWorkflow = () => fs.readFileSync(path.join(h.repoRoot, '.github', 'workflows', 'changeset-check.yml'), 'utf8')

test('o pull request de versão fica fora da checagem de nota', () => {
  assert.match(readWorkflow(), /^ {4}if: github\.head_ref != 'changeset-release\/main'$/m)
})

test('a checagem roda em pull request para a main e só nela', () => {
  assert.match(readWorkflow(), /^on:\n {2}pull_request:\n {4}branches: \[main\]\n/m)
})

test('a automação e o job se chamam Changeset', () => {
  const text = readWorkflow()
  assert.match(text, /^name: Changeset$/m)
  assert.match(text, /^ {2}changeset:\n {4}name: Changeset\n {4}if: /m)
})

test('o job roda no ubuntu-latest', () => {
  assert.match(readWorkflow(), /^ {4}runs-on: ubuntu-latest$/m)
})

test('o checkout busca todo o histórico para comparar com a main', () => {
  assert.match(readWorkflow(), /uses: actions\/checkout@v7\n {8}with:\n {10}fetch-depth: 0\n/)
})

test('o setup-node usa a versão 22 com cache de npm', () => {
  assert.match(readWorkflow(), /uses: actions\/setup-node@v7\n {8}with:\n {10}node-version: 22\n {10}cache: npm\n/)
})

test('instala com npm ci e confere a nota contra a origin/main', () => {
  const text = readWorkflow()
  assert.match(text, /run: npm ci\n/)
  assert.match(text, /run: npx changeset status --since=origin\/main\n?$/m)
})

test('a concorrência é por ref e cancela execução antiga', () => {
  assert.match(readWorkflow(), /^concurrency:\n {2}group: changeset-\$\{\{ github\.ref \}\}\n {2}cancel-in-progress: true$/m)
})

test('a permissão do workflow é só leitura do conteúdo', () => {
  const text = readWorkflow()
  assert.match(text, /^permissions:\n {2}contents: read$/m)
  assert.doesNotMatch(text, /write/)
})

test('o workflow não usa token nem segredo', () => {
  const text = readWorkflow()
  assert.doesNotMatch(text, /secrets\./)
  assert.doesNotMatch(text, /token/i)
})
