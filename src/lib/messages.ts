function wordToBoard (word: string, state: string = 'correct') {
  return [[...word].map(letter => ({ letter, state }))]
}

const enterYourName = [
  [
    { letter: 'i', state: 'correct' },
    { letter: 's', state: 'correct' },
    { letter: 'i', state: 'correct' },
    { letter: 'm', state: 'correct' },
    { letter: '', state: 'absent' }
  ],
  [
    { letter: 'g', state: 'absent' },
    { letter: 'i', state: 'correct' },
    { letter: 'r', state: 'correct' },
    { letter: 'i', state: 'correct' },
    { letter: 'n', state: 'correct' },
  ]
]

const relay = [
  [
    { letter: 'u', state: 'absent' },
    { letter: 'l', state: 'absent' },
    { letter: 't', state: 'absent' },
    { letter: 'r', state: 'absent' },
    { letter: 'a', state: 'correct' }
  ],
]

const happy = [
  [
    { letter: 's', state: 'absent' },
    { letter: 'ü', state: 'present' },
    { letter: 'p', state: 'absent' },
    { letter: 'e', state: 'absent' },
    { letter: 'r', state: 'absent' }
  ],
]

const minds = [
  [
    { letter: 's', state: 'absent' },
    { letter: 'o', state: 'absent' },
    { letter: 'n', state: 'absent' },
    { letter: 'i', state: 'absent' },
    { letter: 'k', state: 'absent' }
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
    { letter: 'A', state: 'present' },
    { letter: 'R', state: 'present' },
    { letter: 'A', state: 'present' },
    { letter: '', state: 'absent' },
    { letter: '', state: 'absent' }
  ],
  [
    { letter: '', state: 'absent' },
    { letter: 'K', state: 'absent' },
    { letter: 'İ', state: 'absent' },
    { letter: '', state: 'absent' },
    { letter: '', state: 'absent' },
  ],
  [
    { letter: '', state: 'absent' },
    { letter: '', state: 'absent' },
    { letter: 'B', state: 'correct' },
    { letter: 'U', state: 'correct' },
    { letter: 'L', state: 'correct' },
  ]
]

export default { wordToBoard, relay, happy, minds, connecting, fight, enterYourName }
