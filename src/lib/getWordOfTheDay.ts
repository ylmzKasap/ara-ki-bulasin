import { answers } from '../words'

export function getWordOfTheDay () {
  /* if (import.meta.env.DEV) {
    return { answer: 'sonik' }
  } */

  const now = dateToUtc(new Date())
  const start = new Date(Date.UTC(2022, 3, 9))
  const diff = Number(now) - Number(start)
  let day = Math.floor(diff / (1000 * 60 * 60 * 24))
  while (day > answers.length) {
    day -= answers.length
  }

  return { answer: answers[day] }
}

function dateToUtc (d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}
