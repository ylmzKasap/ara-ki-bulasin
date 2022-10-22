<script setup lang="ts">
import { watchEffect } from 'vue'
import ConfettiExplosion from 'vue-confetti-explosion'
import { GameCompleteProps, GameState, LettersGuessedProps, LetterState, OtherScore, OtherUser } from './types'
import ExampleWrapper from './components/ExampleWrapper.vue'
import MiniBoardPlaying from './components/MiniBoardPlaying.vue'
import MiniBoardScore from './components/MiniBoardScore.vue'
import MiniScores from './components/MiniScores.vue'
import MiniBoard from './components/MiniBoard.vue'
import Game from './components/Game.vue'
import { useList, useOthers, useMyPresence } from './lib-liveblocks'
import { copyTextToClipboard, copyUrlToClipboard } from './lib/copyText'
import { getWordOfTheDay } from './lib/getWordOfTheDay'
import { sortUsers } from './lib/sortUsers'
import messages from './lib/messages'
import Header from './components/Header.vue'
import { isMobile } from './lib/copyText'

/**
 * WORDLE WARS is a Wordle clone that allows for multiplayer gameplay. It works
 * using Liveblocks (https://liveblocks.io), a set of tools helpful for building
 * collaborative experiences. This demo is written 100% on the front end.
 *
 * The `Game` component was forked from Evan You's open-source VVordle, thanks!
 */

// ================================================================================
// SETUP

// Get word of the day. Resets at UTC +00:00
const { answer } = getWordOfTheDay()
// Current state of game, username, etc
let gameState: GameState = $ref(GameState.CONNECTING)
let username = $ref(localStorage.getItem('username') || '')
let startAnimation = $ref(false)
let confettiAnimation = $ref(false)
let emojiScore = $ref('')
let copyLinkMessage = $ref('')
let clicked = $ref(false)
const shareSupported = navigator.share !== undefined && isMobile()
let shareMessage = shareSupported ? 'Bağlantıyı paylaş' : 'Bağlantıyı kopyala'

// Custom Liveblocks hooks, based on the Liveblocks React library
const [myPresence, updateMyPresence] = useMyPresence()
const others = useOthers()
const savedScores = useList('scores-' + answer)
let mixer = new Audio();
let soundEnabled = $ref(localStorage.getItem('sound'));
if (soundEnabled === null) {
  onUnMute()
}

// Get all others with presence, and return their presence
let othersPresence = $computed(() => {
  return others?.value
    ? [...others.value].filter(other => other.presence).map(other => other.presence)
    : []
})

// Filter others by odd or even number for live scores on either side of screen
const othersFilterOdd = (odd = true) => {
  return othersPresence.filter((o, index) => o?.score && (index % 2 === (odd ? 1 : 0)))
}

// Get users sorted by score
const sortedUsers = $computed(() => {
  if (!myPresence?.value || !othersPresence) {
    return []
  }
  return sortUsers([...othersPresence, myPresence.value].filter(user => user?.score) as OtherUser[])
})

// ================================================================================
// GAME STATE

/**
 * Wordle Wars has a number of different game states, such as CONNECTING, READY,
 * COMPLETE etc. It has a decentralised method of control, meaning that each player
 * sets their own game state, and there is no central server or host. If any player
 * disconnects it will still run smoothly without problems. The game events below
 * run for every player when a change occurs. The event that runs depends on the
 * current state.
 */
const gameEvents: { [key in GameState]?: () => void } = {
  // CONNECTING stage starts when player first loads page
  // Move to intro when connected to presence and scores
  [GameState.CONNECTING]: () => {
    if (myPresence?.value && savedScores?.value()) {
      updateGameStage(GameState.INTRO)
    }
  },

  // INTRO stage starts when selecting username
  // When connected, if scores for current word found, show scores
  [GameState.INTRO]: () => {
    if (savedScores?.value()?.toArray().length) {
      updateGameStage(GameState.SCORES)
    }
  },

  // READY stage starts after ready button pressed
  // When all users are in the READY or PLAYING stages, start game
  [GameState.READY]: () => {
    if (allInStages([GameState.READY, GameState.PLAYING])) {
      startAnimation = true
      setTimeout(() => {
        startAnimation = false
        updateGameStage(GameState.PLAYING)
      }, 800)
    }
  },

  // COMPLETE stage starts on finishing the puzzle
  // When all users are finished, show scores
  [GameState.COMPLETE]: () => {
    if (allInStages([GameState.SCORES, GameState.COMPLETE, GameState.WAITING])) {
      updateGameStage(GameState.SCORES)
    }
  }
}

// On any change, run game event for current state (defined above)
watchEffect(() => {
  gameEvents[gameState]?.()
})

// ================================================================================
// HELPER FUNCTIONS

// Updates the current game stage for local player
function updateGameStage (stage: GameState) {
  if (myPresence?.value) {
    gameState = stage
    updateMyPresence({ stage })
  }
}

// Returns true if every user is in one of the `stages`
function allInStages (stages: GameState[]) {
  if (!others?.value || !others?.value.count) {
    return false
  }
  let myPresenceFound = false
  return stages.some(stage => {
    const othersReady = others.value?.toArray().every(
      other => other.presence && other.presence.stage === stage
    )
    myPresenceFound = myPresenceFound || myPresence!.value.stage === stage
    return Boolean(othersReady)
  }) && myPresenceFound
}

// ================================================================================
// EVENT FUNCTIONS

// Enter the waiting room, set default presence, once username chosen
async function enterWaitingRoom () {
  updateMyPresence({
    name: username,
    board: '',
    score: { [LetterState.ABSENT]: 0, [LetterState.CORRECT]: 0, [LetterState.PRESENT]: 0 },
    stage: gameState,
    rowsComplete: 0,
    timeFinished: Infinity
  })

  updateGameStage(GameState.WAITING)
  localStorage.setItem('username', username)
}


// When current player guesses a row of letters
function onLettersGuessed ({ letterStates, letterBoard }: LettersGuessedProps) {
  const currentScore: OtherScore|any = {
    [LetterState.CORRECT]: 0,
    [LetterState.PRESENT]: 0,
    [LetterState.ABSENT ]: 0
  }
  Object.values(letterStates).forEach(state => {
    currentScore[state] += 1
  })
  const rowsComplete = letterBoard.reduce((acc, curr) => {
    if (curr.every(obj => obj.state !== LetterState.INITIAL)) {
      return acc += 1
    }
    return acc
  }, 0)
  updateMyPresence({ score: currentScore, board: letterBoard, rowsComplete: rowsComplete })
}

// When current player wins or loses game, celebrate, update score with ticks, await others winning
function onGameComplete ({ success, successGrid }: GameCompleteProps) {
  if (!myPresence || !savedScores?.value) {
    return
  }
  updateGameStage(GameState.COMPLETE)
  let updatedPresence: { timeFinished: number, score?: {} } = { timeFinished: Number(Date.now()) }
  if (success) {
    updatedPresence = { ...updatedPresence, score: { ...myPresence.value.score, [LetterState.CORRECT]: 5 }}
    confettiAnimation = true
    setTimeout(() => confettiAnimation = false, 3000)
  }
  updateMyPresence(updatedPresence)
  savedScores.value()!.push(myPresence.value as OtherUser)
  emojiScore = createEmojiScore(successGrid || '')
}

// Copy link on click button
function onCopyLink () {
  copyLinkMessage = copyUrlToClipboard()
  clicked = true;
  setTimeout(() => {
    copyLinkMessage = '';
    clicked = false;
    }, 1400)
}

function playMusic () {
  if (soundEnabled === 'on') {
    mixer.src = 'https://public-reassurance-bucket.s3.eu-central-1.amazonaws.com/random.mp3';
    mixer.load();
    mixer.play();
  }
}

function onMute () {
  soundEnabled = 'off';
  localStorage.setItem('sound', 'off');
  mixer.pause();
  mixer.currentTime = 0;
}

function onUnMute () {
  soundEnabled = 'on';
  localStorage.setItem('sound', 'on');
  playMusic();
}

// Create emoji scores
function createEmojiScore (successGrid: string) {
  let resultString = `#Arayıp bulanlar \n\n`
  sortedUsers.forEach((user, index) => {
    resultString += `${index + 1}. ${user.name}\n`
  })
  resultString += '\n' + successGrid
  return resultString
}

</script>

<template>
  <ExampleWrapper>
    <Header />

    <div class="transition-wrapper">
      <div v-if="gameState === GameState.CONNECTING" id="connecting">
        <MiniBoard class="animate-ping" :large="true" :showLetters="true" :user="{ board: messages.connecting }" :rows="messages.connecting.length" />
      </div>

      <div v-if="gameState === GameState.INTRO" id="intro">
        <div>
          <h2>İsminizi alalım</h2>
          <form @submit.prevent="enterWaitingRoom">
            <label for="set-username">Oyuncu ismi</label>
            <input type="text" id="set-username" v-model="username" autocomplete="off" required />
            <button class="ready-button" @click="playMusic">Oyuna katıl</Button>
          </form>
          <div class="divider" />
          <button class="copy-button" @click="onCopyLink" :disabled="!!copyLinkMessage">
            {{ copyLinkMessage || shareMessage }}
            <svg xmlns="http://www.w3.org/2000/svg" v-if="shareSupported && !clicked" class="inline share-icon -mt-0.5 ml-0.5 h-5 w-5" viewBox="0 0 576 512"><path d="M568.9 143.5l-150.9-138.2C404.8-6.773 384 3.039 384 21.84V96C241.2 97.63 128 126.1 128 260.6c0 54.3 35.2 108.1 74.08 136.2c12.14 8.781 29.42-2.238 24.94-16.46C186.7 252.2 256 224 384 223.1v74.2c0 18.82 20.84 28.59 34.02 16.51l150.9-138.2C578.4 167.8 578.4 152.2 568.9 143.5zM416 384c-17.67 0-32 14.33-32 32v31.1l-320-.0013V128h32c17.67 0 32-14.32 32-32S113.7 64 96 64H64C28.65 64 0 92.65 0 128v319.1c0 35.34 28.65 64 64 64l320-.0013c35.35 0 64-28.66 64-64V416C448 398.3 433.7 384 416 384z"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" v-if="!shareSupported && !clicked" class="inline copy-icon -mt-0.5 ml-0.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" /><path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" /></svg>
            <svg xmlns="http://www.w3.org/2000/svg" v-if="clicked" class="inline share-tick -mt-0.5 ml-0.5 h-5 w-5" viewBox="0 0 512 512"><path d="M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM371.8 211.8C382.7 200.9 382.7 183.1 371.8 172.2C360.9 161.3 343.1 161.3 332.2 172.2L224 280.4L179.8 236.2C168.9 225.3 151.1 225.3 140.2 236.2C129.3 247.1 129.3 264.9 140.2 275.8L204.2 339.8C215.1 350.7 232.9 350.7 243.8 339.8L371.8 211.8z"/></svg>
          </button>
          <div v-if="!shareSupported" class="small-center-message">Oyun linkini kopyala <br> ve önüne gelene gönder.</div>
          <div v-if="shareSupported" class="small-center-message">Oyun linkini <br> önüne gelenle paylaş.</div>
          <div></div>
        </div>
      </div>

      <div v-if="gameState === GameState.WAITING || gameState === GameState.READY" id="waiting">
        <div>
          <h2>Oyuncular bekleniyor</h2>
          <div class="waiting-list">
            <div class="waiting-player">
              <span>{{ myPresence.name }} (siz)</span>
              <div :class="[myPresence.stage === GameState.READY ? 'waiting-player-ready' : 'waiting-player-waiting']">
                {{ myPresence.stage === GameState.READY ? 'Hazır' : 'Bekliyor' }}
              </div>
            </div>
            <div v-for="other in othersPresence" class="waiting-player">
              <span v-if="other.name">{{ other.name }}</span>
              <span v-else><i>İsim seçiyor...</i></span>
              <div :class="[other.stage === GameState.WAITING || other.stage === GameState.INTRO ? 'waiting-player-waiting' : 'waiting-player-ready']">
                {{ other.stage === GameState.READY ? 'Hazır' : other.stage === GameState.PLAYING ? 'Oyunda' : 'Bekliyor' }}
              </div>
            </div>
            <button 
              v-if="myPresence.stage !== GameState.READY"
              @click="updateGameStage(GameState.READY)"
              class="ready-button">
              Hazırım!
            </button>
            <button 
              v-else
              @click="updateGameStage(GameState.WAITING)"
              class="unready-button">
              Hazır değilmişim...
            </button>
            <div class="divider" />
            <button class="copy-button" @click="onCopyLink" :disabled="!!copyLinkMessage">
              {{ copyLinkMessage || shareMessage }}
              <svg xmlns="http://www.w3.org/2000/svg" v-if="shareSupported && !clicked" class="inline share-icon -mt-0.5 ml-0.5 h-5 w-5" viewBox="0 0 576 512"><path d="M568.9 143.5l-150.9-138.2C404.8-6.773 384 3.039 384 21.84V96C241.2 97.63 128 126.1 128 260.6c0 54.3 35.2 108.1 74.08 136.2c12.14 8.781 29.42-2.238 24.94-16.46C186.7 252.2 256 224 384 223.1v74.2c0 18.82 20.84 28.59 34.02 16.51l150.9-138.2C578.4 167.8 578.4 152.2 568.9 143.5zM416 384c-17.67 0-32 14.33-32 32v31.1l-320-.0013V128h32c17.67 0 32-14.32 32-32S113.7 64 96 64H64C28.65 64 0 92.65 0 128v319.1c0 35.34 28.65 64 64 64l320-.0013c35.35 0 64-28.66 64-64V416C448 398.3 433.7 384 416 384z"/></svg>
              <svg xmlns="http://www.w3.org/2000/svg" v-if="!shareSupported && !clicked" class="inline copy-icon -mt-0.5 ml-0.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" /><path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" /></svg>
              <svg xmlns="http://www.w3.org/2000/svg" v-if="clicked" class="inline share-tick -mt-0.5 ml-0.5 h-5 w-5" viewBox="0 0 512 512"><path d="M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM371.8 211.8C382.7 200.9 382.7 183.1 371.8 172.2C360.9 161.3 343.1 161.3 332.2 172.2L224 280.4L179.8 236.2C168.9 225.3 151.1 225.3 140.2 236.2C129.3 247.1 129.3 264.9 140.2 275.8L204.2 339.8C215.1 350.7 232.9 350.7 243.8 339.8L371.8 211.8z"/></svg>
            </button>
            <div v-if="!shareSupported" class="small-center-message">Oyun linkini kopyala <br> ve önüne gelene gönder.</div>
            <div v-if="shareSupported" class="small-center-message">Oyun linkini <br> önüne gelenle paylaş.</div>
            <div v-if="soundEnabled === 'on'" class="volume-icon">
              <i class="fa-solid fa-volume-high" @click="onMute"></i>
            </div>
            <div v-if="soundEnabled === 'off'" class="volume-icon" @click="onUnMute">
              <i class="fa-solid fa-volume-xmark"></i
            ></div>
          </div>

          <div v-if="startAnimation" class="start-animation">
            <MiniBoard class="animate-ping" :large="true" :showLetters="true" :user="{ board: messages.fight }" :rows="messages.fight.length" />
          </div>
        </div>
      </div>


      <div v-if="gameState === GameState.PLAYING || gameState === GameState.COMPLETE" id="playing">
        <MiniScores :sortedUsers="sortedUsers" :shrink="true" />
        <Game :answer="answer" @lettersGuessed="onLettersGuessed" @gameComplete="onGameComplete">
          <template v-slot:board-left>
            <div class="mini-board-container">
              <MiniBoardPlaying v-for="other in othersFilterOdd(true)" :user="other" :showLetters="gameState === GameState.COMPLETE" />
            </div>
          </template>
          <template v-slot:board-right>
            <div class="mini-board-container">
              <MiniBoardPlaying v-for="other in othersFilterOdd(false)" :user="other" :showLetters="gameState === GameState.COMPLETE" />
            </div>
          </template>
        </Game>
      </div>


      <Transition name="fade-scores">
        <div v-if="gameState === GameState.SCORES" id="scores">
          <div>
            <h2>
              <span>Doğru cevap: <strong class="tracking-wider">{{ answer.toLocaleUpperCase('TR') }}</strong></span>
            </h2>
            <div class="divider" />
            <div class="scores-grid">
              <MiniBoardScore v-for="(other, index) in sortUsers(savedScores().toArray())" :user="other" :position="index + 1" :showLetters="true" />
            </div>
            <button v-if="myPresence?.board?.length" @click="copyTextToClipboard(emojiScore)" class="ready-button">
              Puanları kopyala <svg xmlns="http://www.w3.org/2000/svg" class="inline -mt-0.5 ml-0.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" /><path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" /></svg>
            </button>
            <div class="divider" />
            <div class="text-center mt-6">
              Bugünlük bu kadar. Bay bay!
            </div>

          </div>
        </div>
      </Transition>

      <div v-if="confettiAnimation" class="confetti-wrapper">
        <div>
          <ConfettiExplosion :colors="['#1bb238', '#d2a207', '#82918b']" />
        </div>
      </div>

    </div>

  </ExampleWrapper>
</template>

<style scoped>
.transition-wrapper {
  position: relative;
  height: 100%;
}

.transition-wrapper > div {
  min-height: 100%;
}

#connecting, #intro, #waiting {
  font-size: 18px;
  background: #eff5f0;
}

.dark #connecting, .dark #intro, .dark #waiting, .dark #scores {
  background: #18181B;
}

#connecting {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

#intro > div, #waiting > div {
  width: 320px;
  max-width: 100%;
  background: #fff;
  padding: 40px 35px 30px 35px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  flex-direction: column;
}

.dark #intro > div, .dark #waiting > div {
  background: #27272A;
}

label {
  font-size: 16px;
  font-weight: 500;
  opacity: 0.6;
}

.volume-icon {
  display: flex;
  align-items: center;
  margin-top: 15px;
  justify-content: center;
}

.volume-icon > i {
  cursor: pointer;
}

.volume-icon > i:hover {
  color: rgb(214, 51, 15);
}

.volume-icon > i:active {
  transform: scale(0.95);
  opacity: 0.8;
}

input {
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid lightgrey;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.dark input {
  background: #18181B;
  border-color: #52525B;
}

button {
  width: 100%;
  padding: 9px 10px;
  border-radius: 4px;
  color: #fff;
  font-weight: 600;
  transition: background-color ease-in-out 150ms, opacity 150ms ease-in-out;
  margin-top: 24px;
  margin-bottom: 0;
}

button:disabled {
  background-color: #1bb238 !important;
}

button:hover {
  background-color: #28c549;
}

.copy-button:hover {
  background-color: #335fd9;
}

.ready-button:hover {
  background-color: #298f3f;
}

button:active {
  background-color: #1bb238;
}

input:focus-visible, input:focus, button:focus-visible {
  outline: 2px solid #118f2b;
}

h2 {
  font-size: 24px;
  font-weight: 500;
  text-align: center;
  margin-bottom: 24px;
}

#intro, #waiting, #playing {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
}

#playing {
  justify-content: space-between;
}

.mini-board-container {
  margin: 0 40px;
  display: grid;
  grid-template-rows: repeat(2, calc(var(--height) / 2));
  grid-auto-columns: auto;
  grid-auto-flow: column;
  gap: 0 40px;
}

#intro form, .waiting-list {
  width: 100%;
  max-width: 250px;
  margin: 0 auto;
}

#intro form > * {
  display: block;
  margin-bottom: 12px;
  width: 100%;
}

#intro form > *:last-child {
  margin-bottom: 0;
}

#intro form label {
  text-align: left;
}

.small-center-message {
  width: 100%;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  opacity: 0.6;
  margin-top: 12px;
}

.waiting-player {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.waiting-player-waiting, .waiting-player-ready {
  font-weight: 600;
}

.waiting-player-message {
  margin-top: 24px;
}

.start-animation {
  position: fixed;
  display: flex;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  justify-content: center;
  align-items: center;
}

#scores {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: stretch;
  flex-direction: column;
  padding-top: 20px;
}

#scores > div {
  max-width: 538px;
  width: 100%;
  margin: 0 auto;
  padding-bottom: 60px;
  position: relative;
}

#scores h2 {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.scores-grid {
  width: 100%;
  display: grid;
  margin: 28px 0 10px;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: auto;
  grid-gap: 40px;
}

.confetti-wrapper {
  position: fixed;
  top: -15%;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  pointer-events: none;
}

.fade-scores-enter-active,
.fade-scores-leave-active,
.fade-scores-enter-from,
.fade-scores-leave-to {
  left: 50%;
  transform: translateX(-50%);
}

@media (max-width: 415px) {
  header h1 {
    font-size: 28px;
  }
}

@media (max-width: 715px) {
  #intro, #waiting {
    display: block;
    background: #fff;
  }

  #intro > div, #waiting > div {
    margin: 0 auto;
    box-shadow: none;
  }

  #intro > div, #waiting > div {
    background: transparent !important;
  }

  #scores > div {
    max-width: 250px;
  }

  #scores h2 {
    flex-direction: column;
  }

  .scores-grid {
    width: 250px;
    grid-template-columns: repeat(1, 1fr);
  }
}

</style>
