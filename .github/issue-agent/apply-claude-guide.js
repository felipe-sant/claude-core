const fs = require('node:fs')
const path = require('node:path')

const GUIDE_FILE = 'claude-guide.md'
const TARGET_FILE = path.join(__dirname, '..', '..', '.claude', 'CLAUDE.md')

class Refusal extends Error {}

function statWithoutFollowing(file) {
  try {
    return fs.lstatSync(file)
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

function applyGuide(contextDir, targetFile) {
  const sourceFile = path.join(contextDir, GUIDE_FILE)
  const sourceStat = statWithoutFollowing(sourceFile)
  if (!sourceStat) throw new Refusal('O agente não gravou o arquivo do novo guia do Claude.')
  if (!sourceStat.isFile()) throw new Refusal('O arquivo do novo guia do Claude precisa ser um arquivo comum.')
  const targetStat = statWithoutFollowing(targetFile)
  if (targetStat && !targetStat.isFile()) throw new Refusal('O guia do Claude precisa ser um arquivo comum.')
  const guide = fs.readFileSync(sourceFile, 'utf8')
  if (guide.trim() === '') throw new Refusal('O arquivo do novo guia do Claude está vazio.')
  fs.writeFileSync(targetFile, guide)
}

function main() {
  const runnerTemp = process.env.RUNNER_TEMP
  if (!runnerTemp) throw new Refusal('Falta a variável RUNNER_TEMP.')
  applyGuide(path.join(runnerTemp, 'issue-agent'), TARGET_FILE)
  console.log('Guia do Claude atualizado.')
}

if (require.main === module) {
  try {
    main()
  } catch (error) {
    console.log(`::error::${error.message}`)
    process.exit(1)
  }
}

module.exports = { applyGuide, GUIDE_FILE, TARGET_FILE }
