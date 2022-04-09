function wordToBoard (word: string, state: string = 'correct') {
  return [[...word].map(letter => ({ letter, state }))]
}

const enterYourName = [
  [
    { letter: 'e', state: 'correct' },
    { letter: 'n', state: 'correct' },
    { letter: 't', state: 'correct' },
    { letter: 'e', state: 'correct' },
    { letter: 'r', state: 'correct' }
  ],
  [
    { letter: 'y', state: 'present' },
    { letter: 'o', state: 'present' },
    { letter: 'u', state: 'present' },
    { letter: 'r', state: 'present' },
    { letter: '', state: 'absent' },
  ],
  [
    { letter: '', state: 'absent' },
    { letter: 'n', state: 'correct' },
    { letter: 'a', state: 'correct' },
    { letter: 'm', state: 'correct' },
    { letter: 'e', state: 'correct' },
  ]
]

const relay = [
  [
    { letter: 'a', state: 'correct' },
    { letter: 'b', state: 'absent' },
    { letter: 'o', state: 'absent' },
    { letter: 'n', state: 'absent' },
    { letter: 'e', state: 'absent' }
  ],
]

const happy = [
  [
    { letter: 'g', state: 'absent' },
    { letter: 'i', state: 'present' },
    { letter: 'z', state: 'absent' },
    { letter: 'e', state: 'absent' },
    { letter: 'm', state: 'absent' }
  ],
]

const minds = [
  [
    { letter: 'f', state: 'absent' },
    { letter: 'a', state: 'absent' },
    { letter: 'l', state: 'absent' },
    { letter: 'e', state: 'absent' },
    { letter: 'z', state: 'absent' }
  ],
]


const fight = [
  [
    { letter: 'b', state: 'correct' },
    { letter: 'a', state: 'correct' },
    { letter: 'ş', state: 'correct' },
    { letter: 'l', state: 'correct' },
    { letter: 'a', state: 'correct' }
  ],
]

const connecting = [
  [
    { letter: 'n', state: 'correct' },
    { letter: 'i', state: 'correct' },
    { letter: 'h', state: 'absent' },
    { letter: 'a', state: 'present' },
    { letter: 'h', state: 'absent' }
  ],
  [
    { letter: 'a', state: 'present' },
    { letter: 'h', state: 'absent' },
    { letter: 'a', state: 'present' },
    { letter: 'h', state: 'absent' },
    { letter: 'a', state: 'present' },
  ],
  [
    { letter: 'h', state: 'absent' },
    { letter: 'a', state: 'present' },
    { letter: 'h', state: 'absent' },
    { letter: 'a', state: 'present' },
    { letter: 'h', state: 'absent' },
  ]
]

export default { wordToBoard, relay, happy, minds, connecting, fight, enterYourName }
