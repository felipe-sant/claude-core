const packageName = '@felipe-sant/claude-kit'
const emptyNote = /^---\n(\n)?---\n*$/
const typedNote = new RegExp(`^---\\n"${packageName}": (patch|minor|major)\\n---\\n\\n(\\S[\\s\\S]*)$`)

function isValidChangesetNote(content) {
  return emptyNote.test(content) || typedNote.test(content)
}

module.exports = { isValidChangesetNote }
