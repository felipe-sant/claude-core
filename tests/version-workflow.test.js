const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const h = require('./helpers')

const workflow = fs.readFileSync(path.join(h.repoRoot, '.github', 'workflows', 'version.yml'), 'utf8')
const title = 'Chore :see_no_evil: Atualiza versão e CHANGELOG'


test('o pull request de versão abre com a entrada na main e pode ser disparado à mão', () => {
  assert.match(workflow, /^on:\n {2}push:\n {4}branches: \[main\]\n {2}workflow_dispatch:\n/m)
})

test('a automação pode escrever conteúdo e pull request, e nada mais', () => {
  assert.match(workflow, /^permissions:\n {2}contents: write\n {2}pull-requests: write\n/m)
  assert.doesNotMatch(workflow, /id-token/)
})

test('a concorrência não cancela a execução em andamento', () => {
  assert.match(workflow, /^concurrency:\n {2}group: version-\$\{\{ github\.ref \}\}\n {2}cancel-in-progress: false$/m)
})

test('usa a ação de changesets fixada por commit, sem etapa de publicação', () => {
  assert.match(workflow, /uses: changesets\/action@[0-9a-f]{40}$/m)
  assert.doesNotMatch(workflow, /^\s+publish:/m)
  assert.doesNotMatch(workflow, /publish-script/)
})

test('o script de versão, o commit e o título seguem o padrão do projeto', () => {
  assert.match(workflow, /version-script: npm run changeset:version$/m)
  assert.match(workflow, new RegExp(`commit-message: "${title}"$`, 'm'))
  assert.match(workflow, new RegExp(`pr-title: "${title}"$`, 'm'))
})

test('a ação recebe o token do GitHub e o ambiente leva o GITHUB_TOKEN', () => {
  assert.match(workflow, /github-token: \$\{\{ secrets\.GITHUB_TOKEN \}\}$/m)
  assert.match(workflow, /env:\n {10}GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}$/m)
})

test('o texto do pull request só é trocado quando a ação devolve o número e o corpo mudou', () => {
  assert.match(workflow, /if: steps\.changesets\.outputs\.pr-number != ''$/m)
  assert.match(workflow, /NUMBER: \$\{\{ steps\.changesets\.outputs\.pr-number \}\}$/m)
  assert.match(workflow, /node scripts\/prepare-version-pr-body\.js "\$RUNNER_TEMP\/body\.md"/)
  assert.match(workflow, /if \[ "\$changed" = "true" \]/)
  assert.match(workflow, /gh pr edit "\$NUMBER" --body-file/)
})

test('nenhum comando interpola expressão do GitHub diretamente', () => {
  const lines = workflow.split('\n')
  lines.forEach((line, index) => {
    if (!/^\s+(- )?run:/.test(line)) return
    let current = index
    const block = [line]
    if (/run: \|\s*$/.test(line)) {
      while (lines[current + 1] !== undefined && /^\s{14,}\S|^\s*$/.test(lines[current + 1])) block.push(lines[++current])
    }
    assert.doesNotMatch(block.join('\n'), /\$\{\{/, `interpolação em: ${block[0]}`)
  })
})

test('o checkout busca todo o histórico e o Node é o 22 com cache', () => {
  assert.match(workflow, /uses: actions\/checkout@v7\n {8}with:\n {10}fetch-depth: 0\n/)
  assert.match(workflow, /uses: actions\/setup-node@v7\n {8}with:\n {10}node-version: 22\n {10}cache: npm\n/)
  assert.match(workflow, /run: npm ci$/m)
})

test('o workflow não usa token do npm', () => {
  assert.doesNotMatch(workflow, /NPM_TOKEN|NODE_AUTH_TOKEN|registry-url/)
})
