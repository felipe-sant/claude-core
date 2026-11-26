const fs = require('node:fs')

const packageName = '@felipe-sant/claude-kit'
const emptyNote = /^---\n(\n)?---\n*$/
const typedNote = new RegExp(`^---\\n"${packageName}": (patch|minor|major)\\n---\\n\\n(\\S[\\s\\S]*)$`)
const readmeName = 'README.md'

function isValidChangesetNote(content) {
  return emptyNote.test(content) || typedNote.test(content)
}

function listChangesetNoteFiles(directory) {
  return fs.readdirSync(directory).filter((name) => name.endsWith('.md') && name !== readmeName)
}

module.exports = { isValidChangesetNote, listChangesetNoteFiles }
