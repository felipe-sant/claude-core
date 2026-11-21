module.exports = {
  meta: { name: 'claude-core' },
  rules: {
    'no-comments': {
      meta: { type: 'problem', schema: [] },
      create(context) {
        return {
          Program() {
            for (const comment of context.sourceCode.getAllComments()) {
              if (comment.type === 'Shebang') continue
              context.report({ loc: comment.loc, message: 'Comentários não são permitidos no código.' })
            }
          }
        }
      }
    }
  }
}
