module.exports = {
  getlistRegexsValidateLines() {
    const isValidLineToTranslateRegex = /[a-zA-Z\u00C0-\u00FF ]+/i
    const removeSpaceInBlank = /\s+/g

    return { 
      isValidLineToTranslateRegex,
      removeSpaceInBlank
    }
  }
}
