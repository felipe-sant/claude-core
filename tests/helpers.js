const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const { spawnSync } = require('node:child_process')

const repoRoot = path.resolve(__dirname, '..')
const created = []

function tempDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`))
  created.push(dir)
  return dir
}

function cleanup() {
  for (const dir of created.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
    fs.rmSync(`${dir}-worktrees`, { recursive: true, force: true })
  }
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

function makeCore({ items = [], stacks = {}, profiles = {}, version = '1.0.0' } = {}) {
  const core = tempDir('core')
  fs.mkdirSync(path.join(core, 'bin'))
  fs.copyFileSync(path.join(repoRoot, 'bin', 'ai-sync.js'), path.join(core, 'bin', 'ai-sync.js'))
  write(path.join(core, 'package.json'), JSON.stringify({ name: 'fixture', version }))

  const catalog = { stacks, agents: {}, rules: {}, skills: {}, settings: {} }
  for (const item of items) {
    const { group, name, applies = ['all'], files } = item
    const itemPath = group === 'skills' ? `skills/${name}` : group === 'settings' ? `templates/settings.${name}.json` : `${group}/${name}.md`
    catalog[group][name] = { path: itemPath, applies, description: `${name} de teste` }
    if (group === 'skills') {
      for (const [rel, content] of Object.entries(files)) write(path.join(core, itemPath, rel), content)
    } else if (group === 'settings') {
      write(path.join(core, itemPath), JSON.stringify(files, null, 2))
    } else {
      write(path.join(core, itemPath), files)
    }
  }
  write(path.join(core, 'catalog.json'), JSON.stringify(catalog, null, 2))

  fs.mkdirSync(path.join(core, 'profiles'))
  for (const [name, content] of Object.entries(profiles)) {
    write(path.join(core, 'profiles', `${name}.json`), JSON.stringify(content))
  }
  return core
}

function setContent(core, relative, content) {
  write(path.join(core, relative), content)
}

function removeItem(core, group, name) {
  const file = path.join(core, 'catalog.json')
  const catalog = JSON.parse(fs.readFileSync(file, 'utf8'))
  delete catalog[group][name]
  fs.writeFileSync(file, JSON.stringify(catalog, null, 2))
}

function makeTarget(files = {}) {
  const target = tempDir('target')
  for (const [rel, content] of Object.entries(files)) write(path.join(target, rel), content)
  return target
}

function run(core, target, ...args) {
  const result = spawnSync('node', [path.join(core, 'bin', 'ai-sync.js'), ...(target ? [target] : []), ...args], {
    encoding: 'utf8'
  })
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, output: result.stdout + result.stderr }
}

function read(target, rel) {
  return fs.readFileSync(path.join(target, rel), 'utf8')
}

function exists(target, rel) {
  return fs.existsSync(path.join(target, rel))
}

function snapshot(dir) {
  const hash = crypto.createHash('sha256')
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) walk(full)
      else hash.update(path.relative(dir, full)).update(fs.readFileSync(full))
    }
  }
  walk(dir)
  return hash.digest('hex')
}

module.exports = { repoRoot, tempDir, cleanup, write, makeCore, setContent, removeItem, makeTarget, run, read, exists, snapshot }
