export type OtherScore = {
  correct: number
  present: number
  absent: number
}

export type OtherUser = {
  name: string
  ready: boolean
  board: string
  score: OtherScore
  position: number
}

export const enum LetterState {
  INITIAL = 0,
  CORRECT = 'correct',
  PRESENT = 'present',
  ABSENT = 'absent'
}

export type LettersGuessed = Record<string, LetterState>

export const enum GameState {
  INTRO = 'intro',
  CONNECTING = 'connecting',
  WAITING = 'waiting',
  PLAYING = 'playing',
  COMPLETE = 'complete'
}

export type LetterBoard = {
  letter: string,
  state: LetterState[][]
}

export type LettersGuessedProps = {
  letterBoard: LetterBoard
  letterStates: LettersGuessed
}

export type GameCompleteProps = {
  success: boolean,
  successGrid?: string
}