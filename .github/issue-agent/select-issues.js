const fs = require('node:fs')

const MAX_CLASSIFY = 10
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

function hasSizeLabel(issue) {
  return issue.labels.some((label) => label.startsWith(SIZE_PREFIX))
}

function hasAgentClassification(issue) {
  return issue.comments.some((comment) => comment.author === AGENT_AUTHOR && comment.body.includes(CLASSIFICATION_MARK))
}

function hasOwnBranch(issue, branches) {
  return branches.some((name) => new RegExp(`^[a-z]+/${issue.number}-`).test(name))
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

function selectIssues({ issues, openPulls, branches, eventIssue }) {
  const prAllowed = !openPulls.some(isAgentPull)
  const scoped = eventIssue === null ? issues : issues.filter((issue) => issue.number === eventIssue)
  const eligible = scoped.filter(isBaseEligible).sort(byOldest)

  const classify = eligible
    .filter((issue) => !hasSizeLabel(issue) && !hasAgentClassification(issue))
    .slice(0, eventIssue === null ? MAX_CLASSIFY : 1)
    .map((issue) => issue.number)

  const queued = eligible.filter((issue) => issue.labels.includes(SIZE_SMALL) && !SIZES_NOT_TREATED.some((size) => issue.labels.includes(size)) && !hasOwnBranch(issue, branches))
  const prIssue = prAllowed && queued.length > 0 ? queued[0].number : ''

  return { classify, prAllowed, prIssue, reason: buildReason({ classify, prAllowed, prIssue, queued }) }
}

function buildReason({ classify, prAllowed, prIssue, queued }) {
  const parts = []
  parts.push(classify.length > 0 ? `Classificar: ${classify.join(', ')}.` : 'Nenhuma issue para classificar.')
  if (prIssue !== '') parts.push(`Pull request da issue ${prIssue}.`)
  else if (queued.length > 0 && !prAllowed) parts.push('Há pull request do agente aberto: a fila das P espera.')
  else parts.push('Nenhuma issue P na fila.')
  return parts.join(' ')
}

function writeOutputs(file, { classify, prAllowed, prIssue, reason }) {
  const lines = [`classify=${classify.join(',')}`, `pr_allowed=${prAllowed}`, `pr_issue=${prIssue}`, `reason=${reason}`]
  fs.appendFileSync(file, `${lines.join('\n')}\n`)
}

async function request(token, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' }
  })
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

function readEventIssue() {
  if (process.env.GITHUB_EVENT_NAME !== 'issues' || !process.env.GITHUB_EVENT_PATH) return null
  const payload = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
  return payload.issue.number
}

async function main() {
  const token = process.env.GITHUB_TOKEN
  const repository = process.env.GITHUB_REPOSITORY
  if (!token) throw new Error('Falta a variável GITHUB_TOKEN.')
  if (!repository) throw new Error('Falta a variável GITHUB_REPOSITORY.')

  const [issues, openPulls, branches] = await Promise.all([
    fetchIssues(token, repository),
    fetchOpenPulls(token, repository),
    fetchBranches(token, repository)
  ])
  const result = selectIssues({ issues, openPulls, branches, eventIssue: readEventIssue() })
  console.log(result.reason)
  if (process.env.GITHUB_OUTPUT) writeOutputs(process.env.GITHUB_OUTPUT, result)
  else console.log(JSON.stringify(result))
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}

module.exports = { selectIssues, writeOutputs, MAX_CLASSIFY }
