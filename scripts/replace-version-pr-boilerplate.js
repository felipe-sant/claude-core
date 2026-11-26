const projectPhrase =
  'Pull request de versão aberto pela automação de notas de mudança. Ao fazer o merge na `main`, a automação publica a versão no npm e cria a tag e o Release. Enquanto houver notas novas na `main`, este pull request é atualizado.'

const defaultParagraph = /This PR was opened by the .*?this PR will be updated\./s

function replaceVersionPrBoilerplate(body) {
  return body.replace(defaultParagraph, () => projectPhrase)
}

module.exports = { replaceVersionPrBoilerplate, projectPhrase }
