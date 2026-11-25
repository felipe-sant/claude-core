const fs = require('node:fs')
const path = require('node:path')

const MASK = '***'
const MIN_SECRET_LENGTH = 8
const SECRET_ENV_NAMES = ['CLAUDE_CODE_OAUTH_TOKEN', 'GITHUB_TOKEN', 'ACTION_TOKEN']
const OUTPUT_NAME = 'claude-execution-output.json'
const TOKEN_PATTERNS = [
  /gh[pousr]_[A-Za-z0-9]{20,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /sk-ant-[A-Za-z0-9_-]{10,}/g,
  /Bearer\s+[A-Za-z0-9._~+/=-]{20,}/gi,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g
]

function redact(text, secrets) {
  const values = secrets.filter((value) => typeof value === 'string' && value.length >= MIN_SECRET_LENGTH)
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
  const summary = buildSummary(deniedCommands(parseMessages(redacted)))
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
  console.log(summary)
}

if (require.main === module) {
  main()
}

module.exports = { redact, deniedCommands, buildSummary, describeDenial, OUTPUT_NAME }
