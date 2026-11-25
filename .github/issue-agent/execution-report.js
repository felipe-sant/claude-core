const fs = require('node:fs')
const path = require('node:path')

const MASK = '***'
const MIN_SECRET_LENGTH = 8
const SECRET_ENV_NAMES = ['CLAUDE_CODE_OAUTH_TOKEN', 'GITHUB_TOKEN', 'ACTION_TOKEN']
const OUTPUT_NAME = 'claude-execution-output.json'
const DATA_NAME = 'report-data.json'
const LIMIT_PATTERN = /usage limit|limit reached|rate limit|limite de uso/i
const TOKEN_PATTERNS = [
  /gh[pousr]_[A-Za-z0-9]{20,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /sk-ant-[A-Za-z0-9_-]{10,}/g,
  /Bearer\s+[A-Za-z0-9._~+/=-]{20,}/gi,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g
]

function encodeBasicCredential(value) {
  return Buffer.from(`x-access-token:${value}`).toString('base64')
}

function redact(text, secrets) {
  const raw = secrets.filter((value) => typeof value === 'string' && value.length >= MIN_SECRET_LENGTH)
  const values = [...raw, ...raw.map(encodeBasicCredential)]
  const withoutValues = values.reduce((current, value) => current.split(value).join(MASK), text)
  return TOKEN_PATTERNS.reduce((current, pattern) => current.replace(pattern, MASK), withoutValues)
}

function describeDenial(denial) {
  const input = denial.tool_input || {}
  const target = input.command || input.file_path || input.path || ''
  return target ? `${denial.tool_name}: ${target}` : String(denial.tool_name)
}

function deniedCommands(messages) {
  if (!Array.isArray(messages)) return []
  return messages
    .filter((message) => message && message.type === 'result' && Array.isArray(message.permission_denials))
    .flatMap((message) => message.permission_denials)
    .map(describeDenial)
}

function limitWasReached(messages) {
  if (!Array.isArray(messages)) return false
  return messages.some((message) => message && message.type === 'result' && message.is_error === true && LIMIT_PATTERN.test(String(message.result || '')))
}

function buildReportData(messages) {
  return { denied: deniedCommands(messages), limitReached: limitWasReached(messages) }
}

function buildSummary(commands) {
  const lines = ['## Comandos barrados', '']
  if (commands.length === 0) {
    lines.push('Nenhum comando foi barrado nesta execução.')
  } else {
    lines.push(`Comandos barrados nesta execução: ${commands.length}.`, '')
    commands.forEach((command) => lines.push(`- \`${command.replace(/`/g, "'").replace(/\s+/g, ' ')}\``))
  }
  return `${lines.join('\n')}\n`
}

function parseMessages(text) {
  try {
    return JSON.parse(text)
  } catch {
    return []
  }
}

function main() {
  const [sourceFile, outputDir] = process.argv.slice(2)
  const secrets = SECRET_ENV_NAMES.map((name) => process.env[name])
  const raw = fs.existsSync(sourceFile || '') ? fs.readFileSync(sourceFile, 'utf8') : ''
  const redacted = redact(raw, secrets)
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(path.join(outputDir, OUTPUT_NAME), redacted === '' ? '[]' : redacted)
  const data = buildReportData(parseMessages(redacted))
  fs.writeFileSync(path.join(outputDir, DATA_NAME), JSON.stringify(data))
  const summary = buildSummary(data.denied)
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
  console.log(summary)
}

if (require.main === module) {
  main()
}

module.exports = { redact, deniedCommands, buildSummary, buildReportData, describeDenial, OUTPUT_NAME, DATA_NAME }
