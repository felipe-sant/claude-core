const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const { resolveRelease } = require('../scripts/resolve-release')
const { extractChangelogSection } = require('../scripts/extract-changelog-section')
const { isVersionPublished, prepareRelease, formatOutputs } = require('../scripts/prepare-release')
const h = require('./helpers')

afterEach(h.cleanup)

const changelog = '# @felipe-sant/claude-kit\n\n## 1.1.0\n\n### Minor Changes\n\n- a: Nova regra.\n\n## 1.0.0\n\n### Major Changes\n\n- b: Publica o pacote.\n'
const neverPublished = () => ({ status: 1, stderr: 'npm error code E404\nnpm error 404 No match found for version' })
const alreadyPublished = () => ({ status: 0, stderr: '' })

test('versão sem tag já publicada no npm cria o Release sem publicar', () => {
  assert.deepEqual(resolveRelease('1.0.0', [], true), { release: true, publish: false, tag: 'v1.0.0' })
})

test('versão com major 0 não faz nada', () => {
  assert.deepEqual(resolveRelease('0.1.0', [], false), { release: false, publish: false, tag: 'v0.1.0' })
})

test('versão com tag existente não faz nada', () => {
  assert.deepEqual(resolveRelease('1.0.1', ['v1.0.0', 'v1.0.1'], false), { release: false, publish: false, tag: 'v1.0.1' })
})

test('versão sem tag e fora do npm publica e cria o Release', () => {
  assert.deepEqual(resolveRelease('1.0.1', ['v1.0.0'], false), { release: true, publish: true, tag: 'v1.0.1' })
})

test('versão fora do formato MAJOR.MINOR.PATCH dá erro em português', () => {
  for (const version of ['1.0', 'v1.0.0', '1.0.0-beta.1', '']) {
    assert.throws(() => resolveRelease(version, [], false), /Versão inválida/)
  }
})

test('a seção do CHANGELOG vai do título da versão até o próximo título', () => {
  assert.equal(extractChangelogSection(changelog, '1.0.0'), '### Major Changes\n\n- b: Publica o pacote.')
  assert.equal(extractChangelogSection(changelog, '1.1.0'), '### Minor Changes\n\n- a: Nova regra.')
})

test('a falta da seção da versão no CHANGELOG dá erro em português', () => {
  assert.throws(() => extractChangelogSection(changelog, '2.0.0'), /Seção da versão 2\.0\.0 não encontrada no CHANGELOG\.md\./)
})

test('a consulta ao npm com código zero quer dizer publicada', () => {
  assert.equal(isVersionPublished('@felipe-sant/claude-kit', '1.0.0', alreadyPublished), true)
})

test('a consulta ao npm com E404 quer dizer não publicada', () => {
  assert.equal(isVersionPublished('@felipe-sant/claude-kit', '1.0.0', neverPublished), false)
})

test('a consulta ao npm pergunta pelo pacote e pela versão', () => {
  let asked
  isVersionPublished('@felipe-sant/claude-kit', '1.2.3', (args) => {
    asked = args
    return { status: 0, stderr: '' }
  })
  assert.deepEqual(asked, ['view', '@felipe-sant/claude-kit@1.2.3', 'version'])
})

test('erro do npm que não é E404 para a execução', () => {
  const failing = () => ({ status: 1, stderr: 'npm error code ENETUNREACH' })
  assert.throws(() => isVersionPublished('@felipe-sant/claude-kit', '1.0.0', failing), /Não consegui consultar o npm/)
})

test('prepareRelease devolve tag, release, publish e as notas da versão', () => {
  const result = prepareRelease({ version: '1.0.1', existingTags: ['v1.0.0'], changelog: changelog.replace('1.1.0', '1.0.1'), runNpm: neverPublished })
  assert.equal(result.tag, 'v1.0.1')
  assert.equal(result.release, true)
  assert.equal(result.publish, true)
  assert.equal(result.notes, '### Minor Changes\n\n- a: Nova regra.')
})

test('prepareRelease não consulta o npm quando a versão não será lançada', () => {
  const failing = () => {
    throw new Error('não deveria consultar')
  }
  assert.equal(prepareRelease({ version: '0.1.0', existingTags: [], changelog: '', runNpm: failing }).release, false)
  assert.equal(prepareRelease({ version: '1.0.0', existingTags: ['v1.0.0'], changelog: '', runNpm: failing }).release, false)
})

test('prepareRelease com a versão já no npm cria o Release e não publica', () => {
  const result = prepareRelease({ version: '1.0.0', existingTags: [], changelog, runNpm: alreadyPublished })
  assert.equal(result.release, true)
  assert.equal(result.publish, false)
})

test('prepareRelease para com erro quando o CHANGELOG não tem a seção', () => {
  assert.throws(() => prepareRelease({ version: '3.0.0', existingTags: [], changelog, runNpm: neverPublished }), /não encontrada no CHANGELOG\.md/)
})

test('as saídas trazem tag, release, publish e o arquivo de notas só quando há Release', () => {
  assert.equal(formatOutputs({ tag: 'v1.0.0', release: true, publish: false }, '/tmp/notas.md'), 'tag=v1.0.0\nrelease=true\npublish=false\nnotes-file=/tmp/notas.md\n')
  assert.equal(formatOutputs({ tag: 'v0.1.0', release: false, publish: false }), 'tag=v0.1.0\nrelease=false\npublish=false\n')
})
