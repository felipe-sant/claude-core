const fs = require('node:fs')
const path = require('node:path')
const { request } = require('./select-issues')

const API_URL = 'https://api.github.com'
const PAGE_SIZE = 100
const PULL_REQUEST_LINE = 'Aberto pelo agente de issues.'
const DESCRIPTION_FILE = 'pull-request-body.md'
const SIZE_SMALL = 'Size: P'
const SECTIONS = ['O que muda', 'Como foi verificado', 'Observações']
const CLOSING_PATTERN = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\b:?\s*(?:https?:\/\/\S+\/issues\/\d+|GH-\d+|(?:[\w.-]+\/[\w.-]+)?#\d+)/i
const COMMIT_TYPES = {
  fix: 'Fix :bug:',
  feat: 'Feat :sparkles:',
  hotfix: 'Hotfix :ambulance:',
  refactor: 'Refactor :recycle:',
  test: 'Test :test_tube:',
  perf: 'Perf :zap:',
  style: 'Style :art:',
  docs: 'Docs :bulb:',
  build: 'Build :rocket:',
  chore: 'Chore :see_no_evil:',
  revert: 'Revert :rewind:'
}

function findIssueBranch(branches, existingBranches, issueNumber) {
  const pattern = new RegExp(`^(?:${Object.keys(COMMIT_TYPES).join('|')})/${issueNumber}-`)
  const found = branches.filter((name) => pattern.test(name) && !existingBranches.includes(name))
  return { branch: found.length === 1 ? found[0] : '', count: found.length }
}

function sectionPositions(text) {
  return SECTIONS.map((section) => {
    const match = new RegExp(`^## ${section}\\s*$`, 'm').exec(text)
    return match ? match.index : -1
  })
}

function validateDescription(text) {
  if (text.trim() === '') return 'O arquivo da descrição do pull request está vazio.'
  const positions = sectionPositions(text)
  if (positions.some((position) => position < 0)) return `A descrição do pull request precisa das seções: ${SECTIONS.join(', ')}.`
  if (positions[0] >= positions[1] || positions[1] >= positions[2]) return `As seções da descrição do pull request estão fora de ordem: ${SECTIONS.join(', ')}.`
  if (CLOSING_PATTERN.test(text)) return 'A descrição do pull request não pode fechar issue: o vínculo é montado pela automação.'
  return ''
}

function buildBody(text, issueNumber) {
  const trimmed = text.trim()
  const split = sectionPositions(trimmed)[1]
  const head = trimmed.slice(0, split).trimEnd()
  const tail = trimmed.slice(split).trimEnd()
  return `${head}\n\nCloses #${issueNumber}\n\n${tail}\n\n${PULL_REQUEST_LINE}`
}

function buildTitle(branch, issueNumber, issueTitle) {
  return `${COMMIT_TYPES[branch.split('/')[0]]} [#${issueNumber}] ${issueTitle}`
}

function checkSize(labels) {
  return labels.includes(SIZE_SMALL) ? '' : `A issue deixou de ser ${SIZE_SMALL}: o pull request não foi aberto.`
}

class Refusal extends Error {}

async function fetchAllPages(token, url) {
  const items = []
  for (let page = 1; ; page += 1) {
    const batch = await request(token, `${url}${url.includes('?') ? '&' : '?'}per_page=${PAGE_SIZE}&page=${page}`)
    items.push(...batch)
    if (batch.length < PAGE_SIZE) return items
  }
}

function readExistingBranches(issueNumber) {
  const file = path.join(process.env.CHECK_DIR || '', `branches-${issueNumber}`)
  if (!process.env.CHECK_DIR || !fs.existsSync(file)) throw new Refusal('Falta a foto das branches de antes da execução.')
  return fs.readFileSync(file, 'utf8').split('\n').filter((line) => line !== '')
}

async function main() {
  const [contextDir, issueArgument] = process.argv.slice(2)
  const token = process.env.GITHUB_TOKEN
  const repository = process.env.GITHUB_REPOSITORY
  if (!token) throw new Refusal('Falta a variável GITHUB_TOKEN.')
  if (!repository) throw new Refusal('Falta a variável GITHUB_REPOSITORY.')
  if (!contextDir || !/^[1-9][0-9]*$/.test(issueArgument || '')) throw new Refusal('Informe a pasta do contexto e o número da issue.')
  const issueNumber = Number(issueArgument)

  const branches = (await fetchAllPages(token, `${API_URL}/repos/${repository}/branches`)).map((branch) => branch.name)
  const { branch, count } = findIssueBranch(branches, readExistingBranches(issueNumber), issueNumber)
  if (count === 0) {
    console.log(`Nenhuma branch nova da issue ${issueNumber}: nada a abrir.`)
    return
  }
  if (count > 1) throw new Refusal(`Há mais de uma branch nova da issue ${issueNumber}: o pull request não foi aberto.`)

  const issue = await request(token, `${API_URL}/repos/${repository}/issues/${issueNumber}`)
  const sizeProblem = checkSize(issue.labels.map((label) => label.name))
  if (sizeProblem) throw new Refusal(sizeProblem)

  const descriptionFile = path.join(contextDir, DESCRIPTION_FILE)
  if (!fs.existsSync(descriptionFile)) throw new Refusal('O agente não gravou o arquivo da descrição do pull request.')
  const description = fs.readFileSync(descriptionFile, 'utf8')
  const descriptionProblem = validateDescription(description)
  if (descriptionProblem) throw new Refusal(descriptionProblem)

  const base = (await request(token, `${API_URL}/repos/${repository}`)).default_branch
  const comparison = await request(token, `${API_URL}/repos/${repository}/compare/${base}...${branch}`)
  if (comparison.ahead_by < 1) throw new Refusal(`A branch ${branch} não tem commits além da principal.`)

  const owner = repository.split('/')[0]
  const openPulls = await request(token, `${API_URL}/repos/${repository}/pulls?state=open&head=${owner}:${branch}`)
  if (openPulls.length > 0) {
    console.log(`Já há pull request aberto da branch ${branch}.`)
    return
  }

  const created = await request(token, `${API_URL}/repos/${repository}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: buildTitle(branch, issueNumber, issue.title),
      head: branch,
      base,
      body: buildBody(description, issueNumber)
    })
  })
  console.log(`Pull request aberto: ${created.html_url}`)
}

if (require.main === module) {
  main().catch((error) => {
    console.log(`::error::${error.message}`)
    process.exit(1)
  })
}

module.exports = { findIssueBranch, validateDescription, buildBody, buildTitle, checkSize, DESCRIPTION_FILE, PULL_REQUEST_LINE }
