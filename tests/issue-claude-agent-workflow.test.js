const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readWorkflow, jobBlock, topLevel, REQUIRED_DISALLOWED } = require('./issue-workflow-helpers')

const text = readWorkflow('issue-claude-agent.yml')
const job = (name) => jobBlock(text, name)
const allowedOf = (block) => block.slice(block.indexOf('--allowedTools'), block.indexOf('--disallowedTools'))
const disallowedOf = (block) => block.slice(block.indexOf('--disallowedTools'))

test('o número da issue digitado só entra por env e nunca em um comando', () => {
  const matches = text.match(/\$\{\{ inputs\.issue \}\}/g) || []
  assert.equal(matches.length, 1)
  assert.match(job('select'), /env:\n(?:\s+.*\n)*?\s+REQUESTED_ISSUE: \$\{\{ inputs\.issue \}\}/)
  const runLines = text.split('\n').filter((line) => /^\s+(- )?run:/.test(line))
  for (const line of runLines) assert.doesNotMatch(line, /inputs\./)
})

test('a automação se chama Issue Claude Agent', () => {
  assert.match(text, /^name: Issue Claude Agent$/m)
})

test('dispara na mão com o campo issue opcional em texto e na varredura das 02:47', () => {
  const top = topLevel(text)
  assert.match(top, /workflow_dispatch:\n\s+inputs:\n\s+issue:\n\s+description: "Número da issue \(vazio: a P mais antiga da fila\)"\n\s+required: false\n\s+type: string/)
  assert.match(top, /schedule:\n\s+- cron: "47 5 \* \* \*"/)
  assert.doesNotMatch(top, /^\s+issues:/m)
  assert.doesNotMatch(text, /workflow_call/)
})

test('a concorrência é serial, no grupo issue-agent', () => {
  assert.match(topLevel(text), /concurrency:\n\s+group: issue-agent\n\s+cancel-in-progress: false/)
})

test('o topo não dá nenhuma permissão e as permissões dos trabalhos são exatas', () => {
  assert.match(topLevel(text), /^permissions: \{\}$/m)
  assert.match(job('select'), /permissions:\n\s+contents: read\n\s+issues: read\n\s+pull-requests: read\n/)
  assert.doesNotMatch(job('select'), /write/)
  assert.match(job('agent'), /permissions:\n\s+contents: write\n\s+issues: write\n\s+pull-requests: write\n\s+id-token: write\n/)
})

test('a seleção roda no modo agent e expõe pr_issue e reason, sem a ação do Claude', () => {
  const block = job('select')
  assert.match(block, /run: node \.github\/issue-agent\/select-issues\.js agent/)
  for (const output of ['pr_issue', 'reason']) {
    assert.match(block, new RegExp(`${output}: \\$\\{\\{ steps\\.select\\.outputs\\.${output} \\}\\}`))
  }
  assert.doesNotMatch(block, /CLAUDE_CODE_OAUTH_TOKEN|claude-code-action/)
})

test('o agente só roda quando há issue P para tratar', () => {
  const block = job('agent')
  assert.match(block, /needs: select/)
  assert.match(block, /if: needs\.select\.outputs\.pr_issue != ''/)
})

test('a ação do Claude é fixada por SHA, com o segredo certo e sem github_token', () => {
  const block = job('agent')
  assert.match(block, /uses: anthropics\/claude-code-action@[0-9a-f]{40}\n/)
  assert.match(block, /claude_code_oauth_token: \$\{\{ secrets\.CLAUDE_CODE_OAUTH_TOKEN \}\}/)
  assert.match(block, /^\s+display_report: true$/m)
  assert.doesNotMatch(text, /^\s+github_token:/m)
  assert.doesNotMatch(text, /show_full_output: true/)
  assert.doesNotMatch(text, /@main/)
})

test('o checkout baixa o histórico inteiro e não guarda credenciais', () => {
  assert.match(job('agent'), /uses: actions\/checkout@v7\n\s+with:\n\s+fetch-depth: 0\n\s+persist-credentials: false/)
  assert.match(job('select'), /uses: actions\/checkout@v7\n\s+with:\n\s+persist-credentials: false/)
})

test('o contexto filtrado só da pr_issue e a foto de antes vêm antes da ação', () => {
  const block = job('agent')
  assert.ok(block.indexOf('issue-context.js') < block.indexOf('claude-code-action'))
  assert.ok(block.indexOf('issue-check') < block.indexOf('claude-code-action'))
  assert.doesNotMatch(block, /--add-dir [^\n]*issue-check/)
  assert.match(block, /--add-dir \$\{\{ runner\.temp \}\}\/issue-agent/)
  assert.doesNotMatch(text, /CLASSIFY|classify/)
})

test('o prompt usa o agent-prompt, a pr_issue e o link da execução', () => {
  const block = job('agent')
  const step = block.slice(block.indexOf('id: prompt'), block.indexOf('id: claude'))
  assert.match(step, /agent-prompt\.md/)
  assert.match(step, /\$GITHUB_SERVER_URL\/\$GITHUB_REPOSITORY\/actions\/runs\/\$GITHUB_RUN_ID/)
  assert.match(step, /Link da execução: %s/)
})

const FAILURE_MESSAGE = 'O agente falhou antes de concluir: confira o limite de uso do Claude e o log do passo do agente.'

test('um passo avisa a causa provável quando a etapa do agente falha ou é cancelada', () => {
  const block = job('agent')
  const step = stepOf(block, 'Aviso de falha do agente')
  assert.ok(block.indexOf('id: claude') < block.indexOf('name: Aviso de falha do agente'))
  assert.ok(block.indexOf('name: Aviso de falha do agente') < block.indexOf('name: Relatório da execução'))
  assert.match(step, /if: always\(\) && \(steps\.claude\.outcome == 'failure' \|\| steps\.claude\.outcome == 'cancelled'\)/)
  assert.doesNotMatch(step, /success|skipped/)
})

test('o aviso de falha vai como anotação de erro e no resumo, sem ler o texto do erro', () => {
  const step = stepOf(job('agent'), 'Aviso de falha do agente')
  assert.ok(step.includes(`echo "::error::${FAILURE_MESSAGE}"`))
  assert.ok(step.includes(`echo "${FAILURE_MESSAGE}" >> "$GITHUB_STEP_SUMMARY"`))
  assert.doesNotMatch(step, /execution_file|conclusion|\.outputs\./)
})

test('a classificação de tamanho não mostra o aviso de falha do agente', () => {
  const sizeSet = readWorkflow('issue-size-set.yml')
  assert.ok(!sizeSet.includes('limite de uso do Claude'))
  assert.ok(!sizeSet.includes('Aviso de falha do agente'))
})

test('o git é limitado aos subcomandos necessários e o checkout só cria branch', () => {
  const allowed = allowedOf(job('agent'))
  assert.ok(!allowed.includes('Bash(git:*)'))
  for (const subcommand of ['add', 'commit', 'push', 'switch', 'status', 'diff', 'log', 'branch', 'show', 'rev-parse']) {
    assert.ok(allowed.includes(`Bash(git ${subcommand}:*)`), `faltou permitir: git ${subcommand}`)
  }
  assert.ok(allowed.includes('Bash(git checkout -b:*)'))
  assert.ok(!allowed.includes('Bash(git checkout:*)'))
})

test('as ferramentas liberadas cobrem leitura, edição, subagentes, skills, npm e consulta de pull request', () => {
  const allowed = allowedOf(job('agent'))
  for (const tool of ['Read', 'Glob', 'Grep', 'Edit', 'Write', 'Agent', 'Skill']) {
    assert.match(allowed, new RegExp(`[",]${tool}[",]`), `faltou liberar: ${tool}`)
  }
  for (const rule of ['Bash(npm ci)', 'Bash(npm run lint)', 'Bash(npm test)', 'Bash(npm run sync)', 'Bash(node bin/ai-sync.js:*)', 'Bash(gh issue comment:*)', 'Bash(gh pr list:*)']) {
    assert.ok(allowed.includes(rule), `faltou liberar: ${rule}`)
  }
  assert.ok(!allowed.includes('gh pr create'), 'o agente não pode abrir pull request')
})

test('o agente ganha só a chamada exata do script que grava o guia do Claude', () => {
  const allowed = allowedOf(job('agent'))
  assert.ok(allowed.includes('Bash(node .github/issue-agent/apply-claude-guide.js)'))
  assert.ok(!allowed.includes('Bash(node .github/issue-agent/apply-claude-guide.js:*)'))
  assert.ok(!allowed.includes('Bash(node:*)'))
  assert.doesNotMatch(allowed, /(?:Edit|Write)\(/)
  assert.doesNotMatch(allowed, /\.claude\/(?!CLAUDE\.md)/)
})

test('a montagem das instruções informa o arquivo do novo guia do Claude', () => {
  assert.match(job('agent'), /Arquivo do novo guia do Claude: %s/)
  assert.match(job('agent'), /\$CONTEXT_DIR\/claude-guide\.md/)
})

test('a edição de issue só pode pôr e tirar etiquetas', () => {
  const block = job('agent')
  const allowed = allowedOf(block)
  assert.doesNotMatch(allowed, /gh issue edit:\*/)
  assert.ok(allowed.includes('Bash(gh issue edit * --add-label *)'))
  assert.ok(allowed.includes('Bash(gh issue edit * --remove-label *)'))
})

test('as proibições obrigatórias estão entre aspas simples, em dontAsk e com 100 turnos', () => {
  const block = job('agent')
  const disallowed = disallowedOf(block)
  for (const rule of REQUIRED_DISALLOWED) assert.ok(disallowed.includes(rule), `faltou proibir: ${rule}`)
  assert.match(block, /--disallowedTools '[^'\n]*Bash\(\*\$\*\)[^'\n]*'/)
  assert.match(block, /^\s+--permission-mode dontAsk$/m)
  assert.equal(block.match(/--permission-mode/g).length, 1)
  assert.match(block, /--max-turns 100/)
})

test('a conferência final roda sempre e exige Size P ou M, sem pull request desta issue se M', () => {
  const block = job('agent')
  const step = block.slice(block.indexOf('name: Conferência final'))
  assert.match(step, /if: always\(\)/)
  assert.match(step, /::error::/)
  assert.match(step, /refs\/heads\/main/)
  assert.match(step, /Size: P/)
  assert.match(step, /Size: M/)
  assert.match(step, /CLASSIFICATION_MARK/)
  assert.match(step, /PULL_REQUEST_LINE/)
  assert.match(block, /CLASSIFICATION_MARK: Tamanho definido pelo agente de issues/)
  assert.match(block, /PULL_REQUEST_LINE: Aberto pelo agente de issues\./)
  assert.match(step, /labels-/)
})

test('o runner só é usado dentro dos passos e a pasta do contexto vem de runner.temp', () => {
  for (const name of ['select', 'agent']) {
    const block = job(name)
    assert.doesNotMatch(block.slice(0, block.indexOf('    steps:')), /runner\./)
  }
  const definitions = job('agent').match(/CONTEXT_DIR: \$\{\{ runner\.temp \}\}\/issue-agent/g) || []
  assert.equal(definitions.length, 3)
})

test('o arquivo não tem comentários, interpolação de texto livre nem crase dentro de aspas simples', () => {
  assert.doesNotMatch(text, /^\s*#/m)
  assert.doesNotMatch(text, /github\.event\.(issue|comment)/)
  const shellLines = text.split('\n').filter((line) => !line.trim().startsWith('--disallowedTools'))
  assert.doesNotMatch(shellLines.join('\n'), /'[^'\n]*`[^'\n]*'/)
})

test('só o bot do GitHub Actions é autorizado na ação, para o encadeamento e o agendamento', () => {
  const block = job('agent')
  assert.match(block, /^\s+allowed_bots: github-actions$/m)
  assert.equal((text.match(/allowed_bots:/g) || []).length, 1)
  assert.doesNotMatch(text, /allowed_bots: .*\*/)
})

const stepOf = (block, name) => {
  const start = block.indexOf(`- name: ${name}`)
  assert.notEqual(start, -1, `passo ${name} não encontrado`)
  const next = block.indexOf('\n      - ', start + 1)
  return block.slice(start, next === -1 ? undefined : next)
}

test('o passo de abertura do pull request roda depois da ação, só com sucesso, e chama o script com argumentos entre aspas', () => {
  const block = job('agent')
  const step = stepOf(block, 'Abertura do pull request')
  assert.ok(block.indexOf('id: claude') < block.indexOf('name: Abertura do pull request'))
  assert.ok(block.indexOf('name: Abertura do pull request') < block.indexOf('name: Conferência final'))
  assert.match(step, /if: steps\.claude\.outcome == 'success'/)
  assert.doesNotMatch(step, /always\(\)/)
  assert.match(step, /run: node \.github\/issue-agent\/open-pull-request\.js "\$CONTEXT_DIR" "\$PR_ISSUE"/)
  assert.match(step, /GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/)
  assert.match(step, /PR_OPEN_TOKEN: \$\{\{ steps\.app-token\.outputs\.token \|\| secrets\.PR_OPEN_TOKEN \}\}/)
  assert.match(step, /CONTEXT_DIR: \$\{\{ runner\.temp \}\}\/issue-agent/)
  assert.match(step, /CHECK_DIR: \$\{\{ runner\.temp \}\}\/issue-check/)
  assert.doesNotMatch(step, /steps\.prompt|outputs\.text/)
})

test('o token do aplicativo é gerado depois da ação e antes da abertura, só com sucesso e sem derrubar a execução', () => {
  const block = job('agent')
  const step = stepOf(block, 'Token do aplicativo')
  assert.ok(block.indexOf('id: claude') < block.indexOf('name: Token do aplicativo'))
  assert.ok(block.indexOf('name: Token do aplicativo') < block.indexOf('name: Abertura do pull request'))
  assert.match(step, /id: app-token/)
  assert.match(step, /if: steps\.claude\.outcome == 'success'/)
  assert.match(step, /continue-on-error: true/)
})

test('o token do aplicativo usa a ação oficial fixada por commit e só as permissões de pull request e conteúdo', () => {
  const step = stepOf(job('agent'), 'Token do aplicativo')
  assert.match(step, /uses: actions\/create-github-app-token@[0-9a-f]{40}$/m)
  assert.match(step, /app-id: \$\{\{ secrets\.APP_ID \}\}/)
  assert.match(step, /private-key: \$\{\{ secrets\.APP_PRIVATE_KEY \}\}/)
  assert.match(step, /permission-pull-requests: write/)
  assert.match(step, /permission-contents: read/)
  assert.deepEqual(step.match(/permission-[a-z-]+/g).sort(), ['permission-contents', 'permission-pull-requests'])
})

test('o segredo do aplicativo não aparece fora do passo que gera o token', () => {
  const block = job('agent')
  const outside = block.replace(stepOf(block, 'Token do aplicativo'), '')
  assert.doesNotMatch(outside, /APP_PRIVATE_KEY|secrets\.APP_ID/)
})

test('o agente nunca recebe a leitura de arquivo para publicar e o passo de abertura não interpola texto', () => {
  const step = stepOf(job('agent'), 'Abertura do pull request')
  assert.doesNotMatch(step, /\$\{\{ (?!secrets\.GITHUB_TOKEN|steps\.app-token\.outputs\.token \|\| secrets\.PR_OPEN_TOKEN|runner\.temp)/)
})

test('a foto de antes grava as branches da issue e a contagem de comentários do agente', () => {
  const step = stepOf(job('agent'), 'Foto de antes')
  assert.match(step, /branches-\$PR_ISSUE/)
  assert.match(step, /agent-comments/)
})

test('as instruções recebem o caminho do arquivo da descrição do pull request', () => {
  const block = job('agent')
  const step = block.slice(block.indexOf('id: prompt'), block.indexOf('id: claude'))
  assert.match(step, /- Arquivo da descrição do pull request: %s/)
  assert.match(step, /\$CONTEXT_DIR\/pull-request-body\.md/)
})

test('a conferência final reprova branch do agente sem pull request e execução sem rastro', () => {
  const step = stepOf(job('agent'), 'Conferência final')
  assert.match(step, /branches-\$PR_ISSUE/)
  assert.match(step, /agent-comments/)
  assert.match(step, /pulls\?state=open/)
  assert.match(step, /fail "[^"]*sem pull request aberto/)
  assert.match(step, /fail "[^"]*sem pull request e sem comentário/)
  assert.match(step, /steps\.claude\.outcome/)
})

test('a limpeza roda sempre depois da conferência e só apaga branch nova da issue sem pull request aberto', () => {
  const block = job('agent')
  const step = stepOf(block, 'Limpeza')
  assert.ok(block.indexOf('name: Conferência final') < block.indexOf('name: Limpeza'))
  assert.match(step, /if: always\(\)/)
  assert.match(step, /branches-\$PR_ISSUE/)
  assert.match(step, /pulls\?state=open/)
  assert.match(step, /gh api -X DELETE "repos\/\$GITHUB_REPOSITORY\/git\/refs\/heads\/\$branch"/)
})

test('a foto das branches grava a saída da API antes de filtrar, para a falha da API derrubar o passo', () => {
  const step = stepOf(job('agent'), 'Foto de antes')
  assert.doesNotMatch(step, /branches' \| grep/)
  assert.match(step, /--jq '\.\[\]\.name' > "\$CHECK_DIR\/all-branches"/)
  assert.match(step, /grep -E "\^\[a-z\]\+\/\$PR_ISSUE-" "\$CHECK_DIR\/all-branches" > "\$CHECK_DIR\/branches-\$PR_ISSUE" \|\| true/)
})

test('nenhuma chamada gh api é encadeada com pipe, para a falha da API derrubar o passo', () => {
  const piped = job('agent')
    .split('\n')
    .filter((line) => /gh api/.test(line) && /--jq ('[^']*'|"(?:[^"\\]|\\.)*")\s*\|/.test(line))
  assert.deepEqual(piped, [])
})

test('o trabalho do agente não declara limite de pull requests abertos', () => {
  assert.doesNotMatch(job('agent'), /MAX_AGENT_PULLS/)
})
test('a foto de antes grava a contagem de pull requests do agente abertos', () => {
  const step = stepOf(job('agent'), 'Foto de antes')
  assert.match(step, /pulls\?state=open/)
  assert.match(step, /> "\$CHECK_DIR\/agent-pulls"/)
})

test('a conferência final limita a um pull request novo por execução e não a um total', () => {
  const step = stepOf(job('agent'), 'Conferência final')
  assert.doesNotMatch(step, /MAX_AGENT_PULLS/)
  assert.match(step, /agent_pulls_before=\$\(cat "\$CHECK_DIR\/agent-pulls"\)/)
  assert.match(step, /"\$open_agent_pulls" -le \$\(\(agent_pulls_before \+ 1\)\)/)
  assert.doesNotMatch(step, /"\$open_agent_pulls" -le 1 /)
})

test('no tamanho M a conferência exige nenhum pull request desta issue, não zero no total', () => {
  const step = stepOf(job('agent'), 'Conferência final')
  assert.doesNotMatch(step, /"\$open_agent_pulls" -eq 0/)
  assert.match(step, /"Size: M"\) \[ "\$pulls_for_issue" -eq 0 \]/)
  assert.ok(step.indexOf('pulls_for_issue=0') < step.indexOf('case "$size_labels"'))
})

test('o relatório da execução roda sempre depois da ação, antes da abertura do pull request, e redige a saída com os segredos da execução', () => {
  const block = job('agent')
  const step = stepOf(block, 'Relatório da execução')
  assert.ok(block.indexOf('id: claude') < block.indexOf('name: Relatório da execução'))
  assert.ok(block.indexOf('name: Relatório da execução') < block.indexOf('name: Abertura do pull request'))
  assert.match(step, /if: always\(\) && steps\.claude\.outputs\.execution_file != ''/)
  assert.match(step, /node \.github\/issue-agent\/execution-report\.js "\$EXECUTION_FILE" "\$REPORT_DIR"/)
  assert.match(step, /EXECUTION_FILE: \$\{\{ steps\.claude\.outputs\.execution_file \}\}/)
  assert.match(step, /REPORT_DIR: \$\{\{ runner\.temp \}\}\/execution-report/)
  assert.match(step, /CLAUDE_CODE_OAUTH_TOKEN: \$\{\{ secrets\.CLAUDE_CODE_OAUTH_TOKEN \}\}/)
  assert.match(step, /GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/)
  assert.match(step, /ACTION_TOKEN: \$\{\{ steps\.claude\.outputs\.github_token \}\}/)
})

test('só a saída redigida é publicada como artefato, por 7 dias, e a saída completa nunca vai para o log', () => {
  const block = job('agent')
  const step = stepOf(block, 'Saída da execução')
  assert.ok(block.indexOf('name: Relatório da execução') < block.indexOf('name: Saída da execução'))
  assert.match(step, /if: always\(\) && steps\.claude\.outputs\.execution_file != ''/)
  assert.match(step, /uses: actions\/upload-artifact@v4/)
  assert.match(step, /path: \$\{\{ runner\.temp \}\}\/execution-report\/claude-execution-output\.json/)
  assert.match(step, /retention-days: 7/)
  assert.doesNotMatch(step, /path:.*steps\.claude\.outputs\.execution_file/)
  assert.doesNotMatch(text, /show_full_output/)
})

test('o acompanhamento começa depois da foto de antes e antes da ação, pelo token do workflow', () => {
  const block = job('agent')
  const step = stepOf(block, 'Início do acompanhamento')
  assert.ok(block.indexOf('name: Foto de antes') < block.indexOf('name: Início do acompanhamento'))
  assert.ok(block.indexOf('name: Início do acompanhamento') < block.indexOf('id: claude'))
  assert.match(step, /run: node \.github\/issue-agent\/progress-comment\.js start/)
  assert.match(step, /GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/)
  assert.match(step, /CHECK_DIR: \$\{\{ runner\.temp \}\}\/issue-check/)
})

test('o acompanhamento termina no último passo, sempre, atualizando o mesmo comentário com o resultado da execução', () => {
  const block = job('agent')
  const step = stepOf(block, 'Fim do acompanhamento')
  assert.ok(block.indexOf('name: Limpeza') < block.indexOf('name: Fim do acompanhamento'))
  assert.match(step, /if: always\(\)/)
  assert.match(step, /run: node \.github\/issue-agent\/progress-comment\.js end/)
  assert.match(step, /GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/)
  assert.match(step, /AGENT_OUTCOME: \$\{\{ steps\.claude\.outcome \}\}/)
  assert.match(step, /OPEN_OUTCOME: \$\{\{ steps\.open\.outcome \}\}/)
  assert.match(step, /PULL_REQUEST_URL: \$\{\{ steps\.open\.outputs\.pull_request_url \}\}/)
  assert.match(step, /FAILURE_REASON: \$\{\{ steps\.open\.outputs\.failure_reason \}\}/)
  assert.match(step, /REPORT_DIR: \$\{\{ runner\.temp \}\}\/execution-report/)
  assert.match(step, /CHECK_DIR: \$\{\{ runner\.temp \}\}\/issue-check/)
})

test('o passo de abertura do pull request tem o id open e a conferência registra se o agente comentou, sem comentar na issue', () => {
  const block = job('agent')
  assert.match(stepOf(block, 'Abertura do pull request'), /id: open\n/)
  const check = stepOf(block, 'Conferência final')
  assert.doesNotMatch(check, /gh issue comment/)
  assert.doesNotMatch(check, /agent-commented/)
})

test('o registro do comentário do agente tem passo próprio, sempre, antes da conferência final', () => {
  const block = job('agent')
  const step = stepOf(block, 'Registro do comentário do agente')
  assert.ok(block.indexOf('name: Abertura do pull request') < block.indexOf('name: Registro do comentário do agente'))
  assert.ok(block.indexOf('name: Registro do comentário do agente') < block.indexOf('name: Conferência final'))
  assert.match(step, /if: always\(\)/)
  assert.match(step, /GH_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/)
  assert.match(step, /CHECK_DIR: \$\{\{ runner\.temp \}\}\/issue-check/)
  assert.match(step, /select\(\.user\.login == "claude\[bot\]"\)/)
  assert.match(step, /echo yes > "\$CHECK_DIR\/agent-commented"/)
})
