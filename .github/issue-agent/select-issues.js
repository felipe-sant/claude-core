const fs = require('node:fs')
const { fetchWithRetry } = require('./fetch-with-retry')

const MAX_CLASSIFY = 10
const MAX_AGENT_PULLS = 5
const COLLABORATOR_ASSOCIATIONS = ['OWNER', 'MEMBER', 'COLLABORATOR']
const AGENT_AUTHOR = 'claude[bot]'
const CLASSIFICATION_MARK = 'Tamanho definido pelo agente de issues'
const PULL_REQUEST_LINE = 'Aberto pelo agente de issues.'
const SIZE_PREFIX = 'Size:'
const SIZE_SMALL = 'Size: P'
const SIZES_NOT_TREATED = ['Size: M', 'Size: G']
const API_URL = 'https://api.github.com'
const PAGE_SIZE = 100
const BOT_PATH_PREFIX = '/apps/'
const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g
const INLINE_CODE_PATTERN = /`[^`\n]*`/g
const DEPENDENCY_PATTERN = /\bdepende\s+d[eoa]\s+(#\d+(?:(?:\s*,\s*e\s+|\s*,\s*|\s+e\s+)#\d+)*)/gi
const ISSUE_NUMBER_PATTERN = /#(\d+)/g

function hasSizeLabel(issue) {
  return issue.labels.some((label) => label.startsWith(SIZE_PREFIX))
}

function hasAgentClassification(issue) {
  return issue.comments.some((comment) => comment.author === AGENT_AUTHOR && comment.body.includes(CLASSIFICATION_MARK))
}

function hasOwnBranch(issue, branches) {
  return branches.some((name) => new RegExp(`^[a-z]+/${issue.number}-`).test(name))
}

function extractDependencies(body, ownNumber) {
  const text = (body || '').replace(CODE_BLOCK_PATTERN, ' ').replace(INLINE_CODE_PATTERN, ' ')
  const numbers = new Set()
  for (const phrase of text.matchAll(DEPENDENCY_PATTERN)) {
    for (const cited of phrase[1].matchAll(ISSUE_NUMBER_PATTERN)) numbers.add(Number(cited[1]))
  }
  numbers.delete(ownNumber)
  return [...numbers].sort((first, second) => first - second)
}

function openDependencies(issue, openNumbers) {
  return extractDependencies(issue.body, issue.number).filter((number) => openNumbers.has(number))
}

function isBaseEligible(issue) {
  return (
    !issue.isPullRequest &&
    COLLABORATOR_ASSOCIATIONS.includes(issue.authorAssociation) &&
    issue.assignees.length === 0 &&
    issue.linkedPullRequests === 0
  )
}

function isAgentPull(pull) {
  return pull.author === AGENT_AUTHOR || pull.body.includes(PULL_REQUEST_LINE)
}

function byOldest(first, second) {
  return new Date(first.createdAt) - new Date(second.createdAt) || first.number - second.number
}

const REQUESTED_ISSUE_PATTERN = /^[1-9][0-9]*$/
const MODES = ['size-set', 'agent']

function isQueuedSmall(issue, branches, openNumbers) {
  return (
    isBaseEligible(issue) &&
    issue.labels.includes(SIZE_SMALL) &&
    !SIZES_NOT_TREATED.some((size) => issue.labels.includes(size)) &&
    !hasOwnBranch(issue, branches) &&
    openDependencies(issue, openNumbers).length === 0
  )
}

function selectSizeSet({ issues }) {
  const classify = issues
    .filter(isBaseEligible)
    .filter((issue) => !hasSizeLabel(issue) && !hasAgentClassification(issue))
    .sort(byOldest)
    .slice(0, MAX_CLASSIFY)
    .map((issue) => issue.number)
  const reason = classify.length > 0 ? `Classificar: ${classify.join(', ')}.` : 'Nenhuma issue para classificar.'
  return { classify, reason }
}

function dependencyReason(number, open) {
  if (open.length === 0) return ''
  const listed = open.map((cited) => `#${cited}`).join(', ')
  return open.length === 1 ? `A issue ${number} depende da issue ${listed}, ainda aberta.` : `A issue ${number} depende das issues ${listed}, ainda abertas.`
}

function refusalReason(issue, number, branches, openNumbers) {
  if (!issue || issue.isPullRequest) return `A issue ${number} não foi encontrada entre as issues abertas: ela não existe, está fechada ou é um pull request.`
  if (!COLLABORATOR_ASSOCIATIONS.includes(issue.authorAssociation)) return `A issue ${number} não foi aberta por dono, membro ou colaborador do repositório.`
  if (issue.assignees.length > 0) return `A issue ${number} tem responsável.`
  if (issue.linkedPullRequests > 0) return `A issue ${number} já tem pull request ligado.`
  if (SIZES_NOT_TREATED.some((size) => issue.labels.includes(size))) return `A issue ${number} tem o tamanho Size: M ou Size: G.`
  if (!issue.labels.includes(SIZE_SMALL)) return `A issue ${number} não tem o tamanho Size: P.`
  if (hasOwnBranch(issue, branches)) return `A issue ${number} já tem branch própria.`
  return dependencyReason(number, openDependencies(issue, openNumbers))
}

function limitReason(agentPullCount, ending) {
  return `Já há ${agentPullCount} pull requests do agente abertos e o limite é ${MAX_AGENT_PULLS}: ${ending}`
}

function selectAgent({ issues, openPulls, branches, requested }) {
  const requestedText = requested === null ? '' : requested.trim()
  const agentPullCount = openPulls.filter(isAgentPull).length
  const limitReached = agentPullCount >= MAX_AGENT_PULLS
  const openNumbers = new Set(issues.filter((issue) => !issue.isPullRequest).map((issue) => issue.number))

  if (requestedText === '') {
    if (limitReached) return { prIssue: '', reason: limitReason(agentPullCount, 'a fila das P espera.') }
    const queued = issues.filter((issue) => isQueuedSmall(issue, branches, openNumbers)).sort(byOldest)
    if (queued.length === 0) return { prIssue: '', reason: 'Nenhuma issue P na fila.' }
    return { prIssue: queued[0].number, reason: `Pull request da issue ${queued[0].number}.` }
  }

  if (!REQUESTED_ISSUE_PATTERN.test(requestedText)) return { prIssue: '', reason: 'O número informado não é válido: use só dígitos, como 76.' }
  if (limitReached) return { prIssue: '', reason: limitReason(agentPullCount, 'nenhuma issue é tratada agora.') }
  const number = Number(requestedText)
  const reason = refusalReason(issues.find((issue) => issue.number === number), number, branches, openNumbers)
  if (reason !== '') return { prIssue: '', reason }
  return { prIssue: number, reason: `Pull request da issue ${number}.` }
}

function parseMode(value) {
  if (!MODES.includes(value)) throw new Error(`Informe o modo: ${MODES.join(' ou ')}.`)
  return value
}

function writeOutputs(file, outputs) {
  const lines = Object.entries(outputs).map(([name, value]) => `${name}=${value}`)
  fs.appendFileSync(file, `${lines.join('\n')}\n`)
}

function writeSummary(file, reason) {
  fs.appendFileSync(file, `${reason}\n`)
}

async function request(token, url, options = {}) {
  let response
  try {
    response = await fetchWithRetry(url, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' }
    })
  } catch {
    throw new Error(`Não foi possível falar com a API do GitHub em ${url}.`)
  }
  if (!response.ok) throw new Error(`A API do GitHub respondeu ${response.status} em ${url}.`)
  return response.json()
}

async function fetchAllPages(token, url) {
  const items = []
  for (let page = 1; ; page += 1) {
    const separator = url.includes('?') ? '&' : '?'
    const batch = await request(token, `${url}${separator}per_page=${PAGE_SIZE}&page=${page}`)
    items.push(...batch)
    if (batch.length < PAGE_SIZE) return items
  }
}

const ISSUES_QUERY = `query($owner: String!, $name: String!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    issues(states: OPEN, first: ${PAGE_SIZE}, after: $cursor, orderBy: { field: CREATED_AT, direction: ASC }) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number
        createdAt
        body
        authorAssociation
        assignees(first: 1) { totalCount }
        labels(first: 50) { nodes { name } }
        closedByPullRequestsReferences(first: 1, includeClosedPrs: true) { totalCount }
        comments(last: ${PAGE_SIZE}) { nodes { body author { login resourcePath } } }
      }
    }
  }
}`

function normalizeAuthor(author) {
  if (!author) return ''
  return author.resourcePath.startsWith(BOT_PATH_PREFIX) ? `${author.login}[bot]` : author.login
}

function normalizeIssue(node) {
  return {
    number: node.number,
    createdAt: node.createdAt,
    isPullRequest: false,
    authorAssociation: node.authorAssociation,
    assignees: Array.from({ length: node.assignees.totalCount }, () => 'assignee'),
    labels: node.labels.nodes.map((label) => label.name),
    linkedPullRequests: node.closedByPullRequestsReferences.totalCount,
    body: node.body || '',
    comments: node.comments.nodes.map((comment) => ({ author: normalizeAuthor(comment.author), body: comment.body }))
  }
}

async function fetchIssues(token, repository) {
  const [owner, name] = repository.split('/')
  const issues = []
  let cursor = null
  for (;;) {
    const body = JSON.stringify({ query: ISSUES_QUERY, variables: { owner, name, cursor } })
    const payload = await request(token, `${API_URL}/graphql`, { method: 'POST', body })
    if (payload.errors) throw new Error(`A API GraphQL do GitHub devolveu erro: ${payload.errors[0].message}`)
    if (!payload.data || !payload.data.repository) throw new Error(`A API do GitHub não devolveu o repositório ${repository}.`)
    const connection = payload.data.repository.issues
    issues.push(...connection.nodes.map(normalizeIssue))
    if (!connection.pageInfo.hasNextPage) return issues
    cursor = connection.pageInfo.endCursor
  }
}

async function fetchOpenPulls(token, repository) {
  const pulls = await fetchAllPages(token, `${API_URL}/repos/${repository}/pulls?state=open`)
  return pulls.map((pull) => ({ author: pull.user.login, body: pull.body || '' }))
}

async function fetchBranches(token, repository) {
  const branches = await fetchAllPages(token, `${API_URL}/repos/${repository}/branches`)
  return branches.map((branch) => branch.name)
}

async function main() {
  const mode = parseMode(process.argv[2])
  const token = process.env.GITHUB_TOKEN
  const repository = process.env.GITHUB_REPOSITORY
  if (!token) throw new Error('Falta a variável GITHUB_TOKEN.')
  if (!repository) throw new Error('Falta a variável GITHUB_REPOSITORY.')

  const issues = await fetchIssues(token, repository)
  let result
  if (mode === 'size-set') {
    const selection = selectSizeSet({ issues })
    result = { outputs: { classify: selection.classify.join(','), reason: selection.reason }, reason: selection.reason }
  } else {
    const [openPulls, branches] = await Promise.all([fetchOpenPulls(token, repository), fetchBranches(token, repository)])
    const selection = selectAgent({ issues, openPulls, branches, requested: process.env.REQUESTED_ISSUE ?? null })
    result = { outputs: { pr_issue: selection.prIssue, reason: selection.reason }, reason: selection.reason }
  }
  console.log(result.reason)
  if (process.env.GITHUB_OUTPUT) writeOutputs(process.env.GITHUB_OUTPUT, result.outputs)
  else console.log(JSON.stringify(result.outputs))
  if (process.env.GITHUB_STEP_SUMMARY) writeSummary(process.env.GITHUB_STEP_SUMMARY, result.reason)
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}

module.exports = { selectSizeSet, selectAgent, extractDependencies, parseMode, writeOutputs, writeSummary, normalizeAuthor, normalizeIssue, fetchIssues, request, MAX_CLASSIFY, MAX_AGENT_PULLS }
