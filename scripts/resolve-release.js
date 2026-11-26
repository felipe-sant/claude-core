const semver = /^(\d+)\.(\d+)\.(\d+)$/

function resolveRelease(version, existingTags, isPublished) {
  const match = semver.exec(version)

  if (!match) {
    throw new Error(`Versão inválida: "${version}". Use somente MAJOR.MINOR.PATCH.`)
  }

  const tag = `v${version}`
  const major = Number(match[1])

  if (major < 1 || existingTags.includes(tag)) {
    return { release: false, publish: false, tag }
  }

  return { release: true, publish: !isPublished, tag }
}

module.exports = { resolveRelease }
