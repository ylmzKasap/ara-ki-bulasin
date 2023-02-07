<script setup lang="ts">
import { LetterState, OtherUser } from '../types'

const { user, rows = 6, large = false, showLetters = false } = defineProps<{
  user: OtherUser,
  rows?: number
  large?: boolean,
  showLetters?: boolean
}>()

const [fontSize, boxSize] = large ? ['32px', '47px'] : ['16px', '25px']
const cheaterTitles = [
  'über zekâ', 'ultra sonik', 'aynştayn', 'ara ki bul', '800 IQ', 'medyum memiş', 'beyin bedava',
  'ulvi zat', 'wordle lordu', '%100 alın teri', 'mübarek insan', 'Oxford terk', 'zaman yolcusu']

const emptyBoard = $ref(
  Array.from({ length: 6 }, () =>
    Array.from({ length: 5 }, () => ({
      letter: '',
      state: LetterState.INITIAL
    }))
  )
)

const currentBoard = $computed(() => {
  return user.board.length ? user.board : emptyBoard
})

</script>

<template>
  <div>
    <slot />
    <div class="mini-board" v-bind:class="user.cheat ? 'cheat-game' : ''">
      <div class="cheater-label" v-if="user.cheat">{{cheaterTitles[Math.floor(Math.random()*cheaterTitles.length)]}}</div>
      <div
        v-for="row in currentBoard"
        class="mini-board-row"
      >
        <div
          v-for="(tile, index) in row"
          :class="['mini-board-tile', tile.state && 'revealed']"
        >
          <div class="front mini-board-tile-unset"  :style="{ transitionDelay: `${index * 300}ms` }" />
          <div
            :class="['back', tile.state === 'correct' ? user.cheat ? 'cheating-tile' : tile.state : tile.state]"
            :style="{
              transitionDelay: `${index * 300}ms`,
              animationDelay: `${index * 100}ms`
            }"
          >
            {{ showLetters ? tile.letter.toLocaleUpperCase('tr-TR') : '' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mini-board {
  --box-size: v-bind(boxSize);
  --board-rows: v-bind(rows);
  --border-radius: 2px;

  font-size: v-bind(fontSize);
  display: grid;
  grid-template-rows: repeat(var(--board-rows), var(--box-size));
  grid-gap: 3px;
  box-sizing: border-box;
}

.mini-board-row {
  display: grid;
  grid-template-columns: repeat(5, var(--box-size));
  grid-gap: 3px;
}

.mini-board-tile {
  position: relative;
}

.mini-board-tile > div {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.mini-board-tile-unset {
  border: 1px solid #d3d6da;
  background: #fff;
  border-radius: var(--border-radius);
}

.dark .mini-board-tile-unset {
  background: #18181B;
  border-color: #3F3F46;
}

.mini-board-tile .front,
.mini-board-tile .back {
  box-sizing: border-box;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  font-weight: 600;
}

.mini-board-tile .back {
  transform: rotateX(180deg);
}

.mini-board-tile.revealed .front {
  transform: rotateX(180deg);
  border-radius: var(--border-radius);

}

.mini-board-tile.revealed .back {
  transform: rotateX(0deg);
  border-radius: var(--border-radius);
}

.cheat-game {
  position: relative;
}

.cheat-game >.mini-board-row {
  opacity: 0.5;
}

.cheater-label {
  position: absolute;
  background-color: rgb(51, 51, 51);
  z-index: 2;
  transform: rotate(45deg) translate(-50%, -50%);
  top: 65%;
  left: 30%;
  text-align: center;
  width: 200px;
  color: rgb(234, 255, 0);
  font-weight: bold;
  letter-spacing: 0.03rem;
  padding: 5px;
  border-radius: 16px;
  box-shadow: rgb(79, 79, 79) 0px 0px 6px;
}

.dark .cheater-label {
  background-color: rgb(227, 112, 18);
  box-shadow: white 0px 0px 4px;
  color: white;
}

.cheating-tile {
  background-color: rgb(225, 38, 38);
  color: white;
}
</style>
