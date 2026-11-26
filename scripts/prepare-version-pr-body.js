const fs = require('node:fs')
const { replaceVersionPrBoilerplate } = require('./replace-version-pr-boilerplate')

const bodyFile = process.argv[2]

if (bodyFile === undefined) {
  console.error('Informe o arquivo com o corpo do PR de versão.')
  process.exit(1)
}

const current = fs.readFileSync(bodyFile, 'utf8')
const next = replaceVersionPrBoilerplate(current)
const line = `changed=${next === current ? 'false' : 'true'}\n`

fs.writeFileSync(bodyFile, next)

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, line)
} else {
  process.stdout.write(line)
}
