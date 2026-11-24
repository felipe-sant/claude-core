const fs = require('node:fs')
const path = require('node:path')

const COLLABORATOR_ASSOCIATIONS = ['OWNER', 'MEMBER', 'COLLABORATOR']
const API_URL = 'https://api.github.com'
const PAGE_SIZE = 100

function buildContext(issue, comments) {
  return {
    number: issue.number,
    title: issue.title,
    body: issue.body || '',
    labels: issue.labels.map((label) => label.name),
    comments: comments
      .filter((comment) => COLLABORATOR_ASSOCIATIONS.includes(comment.author_association))
      .map((comment) => ({ author: comment.user.login, association: comment.author_association, body: comment.body }))
  }
}

function writeContexts(directory, contexts) {
  fs.mkdirSync(directory, { recursive: true })
  for (const context of contexts) {
    fs.writeFileSync(path.join(directory, `issue-${context.number}.json`), `${JSON.stringify(context, null, 2)}\n`)
  }
}

async function request(token, url) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } })
  if (!response.ok) throw new Error(`A API do GitHub respondeu ${response.status} em ${url}.`)
  return response.json()
}

async function fetchComments(token, repository, number) {
  const comments = []
  for (let page = 1; ; page += 1) {
    const batch = await request(token, `${API_URL}/repos/${repository}/issues/${number}/comments?per_page=${PAGE_SIZE}&page=${page}`)
    comments.push(...batch)
    if (batch.length < PAGE_SIZE) return comments
  }
}

async function main() {
  const token = process.env.GITHUB_TOKEN
  const repository = process.env.GITHUB_REPOSITORY
  const [directory, ...numbers] = process.argv.slice(2)
  if (!token) throw new Error('Falta a variável GITHUB_TOKEN.')
  if (!repository) throw new Error('Falta a variável GITHUB_REPOSITORY.')
  if (!directory || numbers.length === 0) throw new Error('Informe a pasta de saída e os números das issues.')

  const contexts = []
  for (const number of numbers) {
    const issue = await request(token, `${API_URL}/repos/${repository}/issues/${number}`)
    contexts.push(buildContext(issue, await fetchComments(token, repository, number)))
  }
  writeContexts(directory, contexts)
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}

module.exports = { buildContext, writeContexts }
