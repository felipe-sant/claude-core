const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const h = require('./helpers')

const scriptPath = path.join(h.repoRoot, '.github', 'issue-agent', 'open-pull-request.js')
const { findIssueBranch, validateDescription, buildBody, buildTitle, checkSize } = require(scriptPath)

const validDescription = [
  '## O que muda',
  'Texto do que muda.',
  '',
  '## Como foi verificado',
  'Rodei tudo.',
  '',
  '## Observações',
  'Nada de especial.'
].join('\n')

test('monta o corpo com o vínculo ao fim de O que muda e a linha fixa ao fim', () => {
  const body = buildBody(validDescription, 95)
  assert.equal(
    body,
    [
      '## O que muda',
      'Texto do que muda.',
      '',
      'Closes #95',
      '',
      '## Como foi verificado',
      'Rodei tudo.',
      '',
      '## Observações',
      'Nada de especial.',
      '',
      'Aberto pelo agente de issues.'
    ].join('\n')
  )
})

test('monta o título com tipo e ícone da branch, número e título da issue', () => {
  assert.equal(buildTitle('fix/95-algo', 95, 'Agente não abre'), 'Fix :bug: [#95] Agente não abre')
  assert.equal(buildTitle('feat/7-algo', 7, 'Nova coisa'), 'Feat :sparkles: [#7] Nova coisa')
  assert.equal(buildTitle('chore/3-algo', 3, 'Limpa'), 'Chore :see_no_evil: [#3] Limpa')
})

test('acha a única branch nova da issue', () => {
  assert.deepEqual(findIssueBranch(['main', 'fix/95-algo', 'feat/12-outra'], [], 95), { branch: 'fix/95-algo', count: 1 })
})

test('sem branch da issue devolve contagem zero', () => {
  assert.deepEqual(findIssueBranch(['main', 'feat/12-outra'], [], 95), { branch: '', count: 0 })
})

test('com duas branches da issue devolve contagem dois', () => {
  assert.equal(findIssueBranch(['fix/95-a', 'feat/95-b'], [], 95).count, 2)
})

test('não confunde o número da issue com prefixo de outro número', () => {
  assert.equal(findIssueBranch(['fix/950-algo'], [], 95).count, 0)
  assert.equal(findIssueBranch(['fix/9-algo'], [], 95).count, 0)
})

test('ignora branch que já existia antes da execução', () => {
  assert.equal(findIssueBranch(['fix/95-algo'], ['fix/95-algo'], 95).count, 0)
})

test('ignora branch com tipo fora da tabela', () => {
  assert.equal(findIssueBranch(['agente/95-algo'], [], 95).count, 0)
})

test('aceita a descrição com as três seções na ordem', () => {
  assert.equal(validateDescription(validDescription), '')
})

test('recusa descrição vazia', () => {
  assert.notEqual(validateDescription(''), '')
  assert.notEqual(validateDescription('   \n'), '')
})

test('recusa descrição com seções fora de ordem', () => {
  const swapped = ['## Como foi verificado', 'a', '## O que muda', 'b', '## Observações', 'c'].join('\n')
  assert.notEqual(validateDescription(swapped), '')
})

test('recusa descrição sem uma das seções', () => {
  assert.notEqual(validateDescription('## O que muda\na\n\n## Observações\nc'), '')
})

test('recusa vínculo que fecha issue, sem diferenciar maiúsculas', () => {
  for (const word of ['Closes', 'closes', 'FIXES', 'resolves', 'Close', 'Fixed', 'resolved']) {
    assert.notEqual(validateDescription(`${validDescription}\n${word} #12`), '', word)
  }
})

test('aceita menção a issue sem palavra de fechamento', () => {
  assert.equal(validateDescription(`${validDescription}\nVeja a issue #12.`), '')
})

test('aceita só a issue Size: P', () => {
  assert.equal(checkSize(['Size: P', 'bug']), '')
  assert.notEqual(checkSize(['Size: M']), '')
  assert.notEqual(checkSize(['bug']), '')
})

test('recusa vínculo que fecha issue por URL completa, por GH- ou por repositório', () => {
  for (const link of [
    'Closes https://github.com/felipe-sant/claude-kit/issues/12',
    'fixes HTTPS://GITHUB.COM/a/b/issues/3',
    'resolves GH-3',
    'closes felipe-sant/claude-kit#12'
  ]) {
    assert.notEqual(validateDescription(`${validDescription}\n${link}`), '', link)
  }
})
