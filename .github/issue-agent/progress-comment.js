const fs = require('node:fs')
const path = require('node:path')
const { request } = require('./select-issues')

const API_URL = 'https://api.github.com'
const COMMENT_ID_FILE = 'progress-comment-id'
const AGENT_COMMENTED_FILE = 'agent-commented'
const REPORT_DATA_FILE = 'report-data.json'
const MAX_LISTED_COMMANDS = 3

function formatCommand(command) {
  return `\`${command.replace(/`/g, "'").replace(/\s+/g, ' ')}\``
}

function listCommands(commands) {
  return commands.slice(0, MAX_LISTED_COMMANDS).map(formatCommand).join(', ')
}

function buildStartMessage(runUrl) {
  return `O agente de issues começou a trabalhar nesta issue. Acompanhe a execução: ${runUrl}`
}

function describeOutcome(state) {
  if (state.pullRequestUrl) return `O agente de issues abriu o pull request: ${state.pullRequestUrl}`
  if (state.agentOutcome !== 'success') {
    if (state.limitReached) return 'O agente de issues parou porque o limite de uso do Claude foi atingido.'
    const denied = state.denied.length > 0 ? ` Comandos barrados: ${listCommands(state.denied)}.` : ''
    return `O agente de issues falhou durante a execução.${denied}`
  }
  if (state.openOutcome === 'failure') {
    return `O agente terminou, mas o pull request não foi aberto: ${state.failureReason || 'motivo não informado'}`
  }
  if (state.agentCommented) return 'O agente de issues terminou sem abrir pull request e explicou o motivo em um comentário nesta issue.'
  if (state.denied.length > 0) {
    const plural = state.denied.length === 1 ? '1 comando foi barrado' : `${state.denied.length} comandos foram barrados`
    return `O agente de issues desistiu sem fazer a mudança porque ${plural}: ${listCommands(state.denied)}.`
  }
  return 'O agente de issues terminou sem fazer nada: não criou branch e não explicou o motivo.'
}

function buildEndMessage(state) {
  return `${describeOutcome(state)} Execução: ${state.runUrl}`
}

function readFileOr(file, fallback) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : fallback
}

function readReportData(reportDir) {
  try {
    const data = JSON.parse(readFileOr(path.join(reportDir, REPORT_DATA_FILE), '{}'))
    return { denied: Array.isArray(data.denied) ? data.denied : [], limitReached: data.limitReached === true }
  } catch {
    return { denied: [], limitReached: false }
  }
}

function runUrlFromEnv() {
  return `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
}

function commentsUrl() {
  return `${API_URL}/repos/${process.env.GITHUB_REPOSITORY}/issues`
}

async function start() {
  const created = await request(process.env.GITHUB_TOKEN, `${commentsUrl()}/${process.env.PR_ISSUE}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body: buildStartMessage(runUrlFromEnv()) })
  })
  fs.writeFileSync(path.join(process.env.CHECK_DIR, COMMENT_ID_FILE), String(created.id))
}

async function end() {
  const idFile = path.join(process.env.CHECK_DIR, COMMENT_ID_FILE)
  if (!fs.existsSync(idFile)) {
    console.log('Sem comentário de acompanhamento para atualizar.')
    return
  }
  const state = {
    runUrl: runUrlFromEnv(),
    pullRequestUrl: process.env.PULL_REQUEST_URL || '',
    agentOutcome: process.env.AGENT_OUTCOME,
    openOutcome: process.env.OPEN_OUTCOME,
    failureReason: process.env.FAILURE_REASON || '',
    agentCommented: readFileOr(path.join(process.env.CHECK_DIR, AGENT_COMMENTED_FILE), '').trim() === 'yes',
    ...readReportData(process.env.REPORT_DIR)
  }
  await request(process.env.GITHUB_TOKEN, `${commentsUrl()}/comments/${fs.readFileSync(idFile, 'utf8').trim()}`, {
    method: 'PATCH',
    body: JSON.stringify({ body: buildEndMessage(state) })
  })
}

async function main() {
  const mode = process.argv[2]
  if (mode === 'start') return start()
  if (mode === 'end') return end()
  throw new Error('Informe start ou end.')
}

if (require.main === module) {
  main().catch((error) => {
    console.log(`::warning::${error.message}`)
  })
}

module.exports = { buildStartMessage, buildEndMessage, readReportData, COMMENT_ID_FILE, AGENT_COMMENTED_FILE }
