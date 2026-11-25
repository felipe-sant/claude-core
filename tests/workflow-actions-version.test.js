const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const h = require('./helpers')

const workflowsDir = path.join(h.repoRoot, '.github', 'workflows')
const workflowFiles = fs.readdirSync(workflowsDir).filter((name) => name.endsWith('.yml'))

for (const action of ['checkout', 'setup-node']) {
  test(`todas as automações usam a versão 7 da ação ${action}`, () => {
    for (const file of workflowFiles) {
      const text = fs.readFileSync(path.join(workflowsDir, file), 'utf8')
      const uses = text.match(new RegExp(`uses: actions/${action}@\\S+`, 'g')) || []
      for (const line of uses) {
        assert.equal(line, `uses: actions/${action}@v7`, `${file}: ${line}`)
      }
    }
  })
}

test('ao menos uma automação usa cada ação atualizada', () => {
  const all = workflowFiles.map((file) => fs.readFileSync(path.join(workflowsDir, file), 'utf8')).join('\n')
  assert.match(all, /uses: actions\/checkout@v7/)
  assert.match(all, /uses: actions\/setup-node@v7/)
})
