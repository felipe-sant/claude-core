const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const h = require('./helpers')

function readWorkflow(name) {
  return fs.readFileSync(path.join(h.repoRoot, '.github', 'workflows', name), 'utf8')
}

function jobBlock(text, name) {
  const lines = text.split('\n')
  const start = lines.findIndex((line) => line === `  ${name}:`)
  assert.notEqual(start, -1, `job ${name} não encontrado`)
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => /^ {2}\S/.test(line))
  return rest.slice(0, end === -1 ? undefined : end).join('\n')
}

function topLevel(text) {
  return text.slice(0, text.indexOf('\njobs:'))
}

const REQUIRED_DISALLOWED = [
  'Bash(*$*)',
  'Bash(*`*)',
  'Bash(*environ*)',
  'Bash(*/proc/*)',
  'Bash(*--body-file*)',
  'Bash(*--file*)',
  'Bash(*--template*)',
  'Bash(* -F*)',
  'Bash(* -T *)',
  'Bash(env:*)',
  'Bash(printenv:*)',
  'Bash(export:*)',
  'Bash(set:*)',
  'Bash(declare:*)',
  'Bash(cat *environ*)',
  'Bash(head *environ*)',
  'Bash(tail *environ*)',
  'Bash(echo *TOKEN*)',
  'Bash(printf *TOKEN*)',
  'Read(//proc/**)',
  'Bash(gh issue edit *--title*)',
  'Bash(gh issue edit *--body*)',
  'Bash(gh issue edit *--add-assignee*)',
  'Bash(gh issue edit *--remove-assignee*)',
  'Bash(gh issue edit *--add-project*)',
  'Bash(gh issue edit *--remove-project*)',
  'Bash(gh issue edit *--milestone*)',
  'Bash(gh pr merge:*)',
  'Bash(gh issue view:*)',
  'Bash(gh api:*)',
  'Bash(git push --force:*)',
  'Bash(git push -f:*)',
  'Bash(git push --force-with-lease:*)',
  'Bash(git push origin main:*)',
  'Bash(git push origin HEAD:main:*)'
]

module.exports = { readWorkflow, jobBlock, topLevel, REQUIRED_DISALLOWED }
