const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const h = require('./helpers')

const ci = fs.readFileSync(path.join(h.repoRoot, '.github', 'workflows', 'ci.yml'), 'utf8')

test('o CI roda o actionlint em todos os workflows', () => {
  assert.match(ci, /^ {2}actionlint:$/m)
  assert.match(ci, /\.\/actionlint/)
})

test('o actionlint é baixado de uma versão fixa, nunca de main', () => {
  assert.match(ci, /rhysd\/actionlint\/v\d+\.\d+\.\d+\/scripts\/download-actionlint\.bash\) \d+\.\d+\.\d+/)
  assert.doesNotMatch(ci, /actionlint\/main/)
})

test('o actionlint não ignora regras nem arquivos', () => {
  assert.doesNotMatch(ci, /-ignore|-shellcheck=|-oneline.*\|\| true/)
})
