const fs = require('fs')
const path = require('path')
const readline = require('linebyline')
const axios = require('axios')
require('dotenv').config()

const createTranslatedSubtitleFile = (pathFileAndName) => {
  const translatedSubtitleFile = fs.createWriteStream(pathFileAndName, {
    flags: 'a'
  })

  return translatedSubtitleFile
}

const writeInFile = (streamFile, text) => {
  streamFile.write(text)
}

const formatterAuthorizationCode = () => {
  const authenticationCode = `apikey:${process.env.API_KEY_IBM}`;
  const authenticationCodeFormatted =
    Buffer.from(authenticationCode).toString('base64');

  return authenticationCodeFormatted;
}

const translate = async (textToBeTranslated, languageOptions) => {
  const url = process.env.URL_PROXY_CORS + process.env.URL_ACCESS_IBM
  const data = {
    text: textToBeTranslated,
    model_id: languageOptions // From English to Portuguese, more informations -> https://cloud.ibm.com/docs/language-translator?topic=language-translator-customizing
  }
  const authenticationCode = formatterAuthorizationCode()
  const optionsFetchIBM = {
    method: 'POST',
    headers: {
      'x-requested-with': 'xhr',
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + authenticationCode
    },
    data: JSON.stringify(data),
    url,
  };

  try {
    const response = await axios(optionsFetchIBM)
    const textTranslated = response.data 
      ? response.data.translations[0].translation
      : ''

    return textTranslated
  } catch (err) {
    throw err
  }
}

//Variables validations
const { getlistTagsHTML } = require('./utils/list-tags-html')
const { getlistRegexsValidateLines } = require('./utils/regexs-validate-lines')

const fileName = 'legendTest.srt'
const pathFileBeforeTranslating = path.resolve(__dirname, 'subtitles', 'before-translating', fileName)
const pathFileAfterTranslating = path.resolve(__dirname, 'subtitles', 'after-translating', fileName)
const translatedSubtitleFile = createTranslatedSubtitleFile(pathFileAfterTranslating)

const linesWithoutTags = []
const lineReader = readline(pathFileBeforeTranslating)

lineReader.on('line', async (line) => {
  const listTagsHTML = getlistTagsHTML()

  //Step 1 - remove tags HTML
  let lineWithoutTagsHTML = line
  for (const tag of listTagsHTML) {
    if (line.includes(tag)) lineWithoutTagsHTML = lineWithoutTagsHTML.replace(tag, '')
  }

  linesWithoutTags.push(lineWithoutTagsHTML)
})

lineReader.on('end', async () => {
  processLinesFromFile()
})

const processLinesFromFile = async () => {
  const { removeSpaceInBlank, isValidLineToTranslateRegex } = getlistRegexsValidateLines()

  for (const [index, line] of linesWithoutTags.entries()) {
    //Step 2 - tests if the line has any letters to be translated
    const lineWithoutSpace = line.replace(removeSpaceInBlank, '')
    if (isValidLineToTranslateRegex.test(lineWithoutSpace)) {
      const translatedLine = await translate(line, 'pt-en')
      writeInFile(translatedSubtitleFile, index !== 0 ? `\r\n${translatedLine}` : translatedLine)
    } else {
      writeInFile(translatedSubtitleFile, index !== 0 ? `\r\n${line}` : line)
    }
  }
}
