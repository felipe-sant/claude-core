const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { resolveRelease } = require('./resolve-release')
const { extractChangelogSection } = require('./extract-changelog-section')

const notFoundCode = 'E404'

function runNpmCommand(args) {
  const result = spawnSync('npm', args, { encoding: 'utf8' })
  return { status: result.status, stderr: result.stderr || '' }
}

function isVersionPublished(packageName, version, runNpm) {
  const result = runNpm(['view', `${packageName}@${version}`, 'version'])

  if (result.status === 0) {
    return true
  }

  if (result.stderr.includes(notFoundCode)) {
    return false
  }

  throw new Error(`Não consegui consultar o npm: ${result.stderr.trim()}`)
}

function prepareRelease({ packageName = '@felipe-sant/claude-kit', version, existingTags, changelog, runNpm }) {
  const planned = resolveRelease(version, existingTags, false)

  if (!planned.release) {
    return planned
  }

  const published = isVersionPublished(packageName, version, runNpm)
  const decision = resolveRelease(version, existingTags, published)

  return { ...decision, notes: extractChangelogSection(changelog, version) }
}

function formatOutputs({ tag, release, publish }, notesFile) {
  const lines = [`tag=${tag}`, `release=${release}`, `publish=${publish}`]

  if (notesFile !== undefined) {
    lines.push(`notes-file=${notesFile}`)
  }

  return `${lines.join('\n')}\n`
}

function readChangelog() {
  return fs.existsSync('CHANGELOG.md') ? fs.readFileSync('CHANGELOG.md', 'utf8') : ''
}

function listTags() {
  const result = spawnSync('git', ['tag', '--list'], { encoding: 'utf8' })

  if (result.status !== 0) {
    throw new Error(`Não consegui listar as tags: ${result.stderr.trim()}`)
  }

  return result.stdout.split('\n').filter((tag) => tag !== '')
}

function main() {
  const { name, version } = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const result = prepareRelease({ packageName: name, version, existingTags: listTags(), changelog: readChangelog(), runNpm: runNpmCommand })

  let notesFile
  if (result.release) {
    const folder = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'release-'))
    notesFile = path.join(folder, 'notes.md')
    fs.writeFileSync(notesFile, `${result.notes}\n`)
  }

  const outputs = formatOutputs(result, notesFile)

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, outputs)
  } else {
    process.stdout.write(outputs)
  }
}

if (require.main === module) {
  main()
}

module.exports = { isVersionPublished, prepareRelease, formatOutputs }
