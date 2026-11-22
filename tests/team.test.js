const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const repoRoot = path.resolve(__dirname, '..')
const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, 'catalog.json'), 'utf8'))

function body(name) {
  return fs.readFileSync(path.join(repoRoot, catalog.agents[name].path), 'utf8')
}

const devs = ['dev-frontend', 'dev-backend', 'dev-mobile', 'dev-devops', 'dev-database', 'dev-fullstack']

test('o gate de cada tarefa inclui o typecheck e o de fase roda uma vez ao fim da fase', () => {
  for (const name of devs) {
    const text = body(name)
    assert.match(text, /Nunca commite sem o typecheck/, `${name} não pode commitar sem o typecheck`)
    assert.match(text, /`Typecheck lento`/, `${name} deve respeitar o aviso de typecheck lento`)
    assert.match(text, /`Gate de fase`.*build, suíte completa e lint completo/, `${name} deve rodar o gate de fase`)
    assert.match(text, /incluindo o typecheck/, `${name} deve registrar o typecheck no status`)
  }
})

test('o executor não commita sem o typecheck e registra a evidência dele', () => {
  const text = body('executor')

  assert.match(text, /Nunca commite sem o typecheck/)
  assert.match(text, /incluindo o typecheck/)
})

test('o sdd escreve o gate rápido com typecheck e o gate de fase, e trata o typecheck lento', () => {
  const text = body('sdd')

  assert.match(text, /typecheck do projeto, quando existe, o teste da tarefa e o lint dos arquivos alterados, nunca sem o typecheck/)
  assert.match(text, /`Gate de fase`: build, suíte completa e lint completo/)
  assert.match(text, /`Typecheck lento`/)
  assert.doesNotMatch(text, /rápido, completo ou build/)
})

test('o reviewer confere a evidência do typecheck e roda o gate de fase uma vez no último commit', () => {
  const text = body('reviewer')

  assert.match(text, /evidência do gate, incluindo o typecheck/)
  assert.match(text, /`Gate de fase`.*uma vez no último commit/)
})

test('o orquestrador exige o gate com typecheck e o gate de fase', () => {
  assert.match(body('orchestrator'), /nunca sem o typecheck.*`Gate de fase`/s)
})

test('quem chama executor ou sdd avisa a orchestrator quando o agente não está disponível, e ela orienta o usuário', () => {
  for (const name of [...devs, 'dev-doc']) {
    const text = body(name)
    assert.match(text, /não está disponível na sessão/, `${name} deve avisar quando um agente faltar`)
    assert.match(text, /abrir uma sessão nova/, `${name} deve dizer a causa provável`)
    assert.match(text, /registrando no resumo final que não houve delegação/, `${name} deve registrar a falta de delegação`)
  }
  const orchestrator = body('orchestrator')
  assert.match(orchestrator, /não está disponível na sessão/)
  assert.match(orchestrator, /rodar o `ai-sync` e abrir uma sessão nova/)
})

test('o orquestrador identifica cada agente pelo nome seguido da função abreviada', () => {
  const text = body('orchestrator')

  assert.match(text, /## Nome com a função/)
  assert.match(text, /`Rika \(PO\)`/)
  for (const abbreviation of ['PO', 'Dev Front', 'Dev Back', 'Dev Mobile', 'Dev Ops', 'Dev DB', 'Dev Full', 'Dev Doc', 'Rev', 'QA', 'Design']) {
    assert.match(text, new RegExp(`\`${abbreviation}\``), `falta a abreviação ${abbreviation}`)
  }
  assert.match(text, /use `rika-po`/)
})

test('o orquestrador mostra uma tabela do que cada agente do time está fazendo', () => {
  const text = body('orchestrator')

  assert.match(text, /## Painel do time/)
  assert.match(text, /\| Agente \| Fazendo \| Estado \| Espera por \|/)
  assert.match(text, /trabalhando.*aguardando.*bloqueado.*pronto/s)
  assert.match(text, /antes de fazer uma pergunta ao usuário/)
  assert.match(text, /não repita a tabela se nada mudou/)
})

test('o modelo base não nega a leitura do .env e as regras mandam copiar sem expor o conteúdo', () => {
  const template = fs.readFileSync(path.join(repoRoot, 'templates', 'settings.base.json'), 'utf8')
  const security = fs.readFileSync(path.join(repoRoot, 'rules', 'security-standard.md'), 'utf8')

  assert.doesNotMatch(template, /\.env/)
  assert.match(security, /O `\.env` pode ser lido e copiado/)
  assert.match(security, /nunca imprima os valores/)
  assert.match(body('orchestrator'), /copia para ela, com `cp`, os arquivos de configuração locais/)
})
