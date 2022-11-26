<script lang="ts">
// Runs immediately to avoid FOUC
const defaultDarkTheme = (() => {
  let dark
  const alreadySet = localStorage.getItem('darkMode')
  if (alreadySet) {
    dark = alreadySet === 'on'
  } else {
    dark = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) || false
  }
  if (dark) {
    document.documentElement.classList.add('dark')
  }
  return dark
})()

const defaultColourBlindTheme = (() => {
  if (localStorage.getItem('colourBlindMode') === 'on') {
    document.documentElement.classList.add('colourblind')
    return true
  }
  return false
})()
</script>

<script lang="ts" setup>
import axios, { AxiosError } from 'axios'
import MiniBoard from './MiniBoard.vue'
import messages from '../lib/messages'
import Logo from '../Logo.vue'

let darkMode = $ref(defaultDarkTheme)
let colourBlindMode = $ref(defaultColourBlindTheme)
let infoOpen = $ref(false)
let privateId = $ref(localStorage.getItem('private_id') || '')
let otherAccountId = $ref('')
let formError = $ref('')
let merging = $ref(false)
let merged = $ref(false)

function toggleDarkMode () {
  darkMode = !darkMode
  document.documentElement.classList.toggle('dark')
  localStorage.setItem('darkMode', darkMode ? 'on' : 'off')
}

function toggleColourBlindMode () {
  colourBlindMode = !colourBlindMode
  document.documentElement.classList.toggle('colourblind')
  localStorage.setItem('colourBlindMode', colourBlindMode ? 'on' : 'off')
}


function toggleInfoOpen () {
  infoOpen = !infoOpen
  document.documentElement.classList.toggle('overflow-hidden')
}

async function merge_accounts () {
  if (otherAccountId.length !== 128) {
    formError = "Kimlik numarasını kontrol edin"
    return
  }
  if (merging || merged) {
    return;
  }
  if (!privateId) {
    privateId = localStorage.getItem('private_id') || '';
  }
  try {
    formError = "";
    merging = true;
    const mergeResponse = await axios.put('https://server.arakibulasın.com/player/merge', {
    private_id_to_merge: otherAccountId,
    private_id_to_be_merged: privateId
  })
    merged = true;
    merging = false;
    localStorage.setItem('private_id', mergeResponse.data.private_id);
    localStorage.setItem('public_id', mergeResponse.data.public_id);
    location.reload();
  } catch (err) {
    merging = false;
    if (err instanceof AxiosError) {
      const errorString = err.response?.data.error;
      formError = errorString === 'Player does not exist'
      ? 'Öyle birini bulamadık'
      : errorString;
    } else {
      console.log('Unexpected error', err);
    }
  }
}
</script>

<template>
  <div v-if="infoOpen" class="info">
    <div>
      <h2>
        <span>
          Bilgi
        </span>
        <button @click="toggleInfoOpen">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </h2>
      <p>
        <strong>WORDLE WARS</strong> <a class="link" href="https://twitter.com/ctnicholasdev">@ctnicholasdev</a> tarafından oluşturulmuştur.
      </p>
      <p>Bu versiyon büyük çoğunlukla Türk Dil Kurumu sözlüğünden seçilmiş 5500 olası kelime
        ve bu kelimeler arasından %100 alın teriyle seçilmiş yaklaşık 1700 olası doğru cevaptan oluşur.</p>
      <div class="divider" />
      <h2 class="mt-6">Nasıl oynuyoruz?</h2>
      <p>
        Günün kelimesini 6 denemede tahmin etmelisiniz.
      </p>
      <p>
        Her tahmin 5 harfli, geçerli bir kelime olmalıdır. Enter tuşuna basarak kelimeyi girin.
      </p>
      <p>
        Her tahminden sonra kutuların rengi değişerek doğru kelimeye ne kadar yaklaştığınızı gösterecek.
      </p>
      <p>
        Doğru kelimeyi en az tahminde bulan kişi oyunu kazanır.
      </p>
      <div class="divider" />
      <p>
        <strong>Örnekler</strong>
      </p>
      <div class="example">
        <p>
          <MiniBoard :large="true" :showLetters="true" :user="{ board: messages.relay }" :rows="messages.relay.length" />
        </p>
        <p>Kelimede <strong>A</strong> harfi mevcut ve doğru yerde.</p>
      </div>
      <div class="example">
        <p>
          <MiniBoard :large="true" :showLetters="true" :user="{ board: messages.happy }" :rows="messages.happy.length" />
        </p>
        <p>Kelimede <strong>Ü</strong> harfi mevcut ama yanlış yerde.</p>
      </div>
      <div class="example">
        <p>
          <MiniBoard :large="true" :showLetters="true" :user="{ board: messages.minds }" :rows="messages.minds.length" />
        </p>
        <p>Kelimede harflerin hiçbiri yok.</p>
      </div>
      <div class="divider" />
      <h2 class="mt-6">Hesap bilgileri</h2>
      <div style="display: flex; flex-direction: column;">
        <p>Aşağıdaki metin hesabınızın kimlik numarasıdır.
          Olur da tarayıcı verileriniz silinirse hesabı kurtarmak için bir yere kaydetseniz fena olmaz.
          Öyle herkesle paylaşmayın.</p>
        <code style="overflow-wrap: break-word; margin-top: 15px;">
          {{privateId ? privateId : "Numara bulunamadı, sayfayı yenileyin."}}
        </code>
      <h2 class="mt-6">Hesap birleştirme</h2>
      <p>Birleştireceğiniz hesabın kimlik numarasını aşağıdaki alana yapıştırın.</p>
      <p>İşlem sonucunda bu tarayıcıdaki bilgilerin yerini, yapıştırdığınız hesabın bilgileri alacak.</p>
      <p>İki hesapta da oynadığınız oyunların başına kötü bir şey gelmeyecek.</p>
      <form class="merge-accounts-form" @submit.prevent="merge_accounts">
        <input class="merge-input" type="text" v-model="otherAccountId"/>
        <p class="merge-error" v-if="formError">{{formError}}</p>
        <button class="merge-button" :class="{merging: merging, merged: merged}" type="submit">
          {{merging ? 'Birleştiriliyor...' : merged ? 'Birleştirildi!' : 'Birleştir'}}
        </Button>
      </form>
      </div>
      
      <div class="divider" />
      <p>
        <em>Her gün bir kelime, öyle fazla şey yapmayın.</em>
      </p>

    </div>
  </div>
  <header>
    <div>
      <button @click="toggleInfoOpen">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      <a class="button" href="https://github.com/ylmzKasap/ara-ki-bulasin" target="_blank">
        <svg class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 1.66664C8.90569 1.66664 7.82206 1.88219 6.81101 2.30098C5.79997 2.71977 4.88131 3.3336 4.10749 4.10742C2.54468 5.67022 1.66671 7.78984 1.66671 9.99998C1.66671 13.6833 4.05838 16.8083 7.36671 17.9166C7.78338 17.9833 7.91671 17.725 7.91671 17.5V16.0916C5.60838 16.5916 5.11671 14.975 5.11671 14.975C4.73338 14.0083 4.19171 13.75 4.19171 13.75C3.43338 13.2333 4.25004 13.25 4.25004 13.25C5.08338 13.3083 5.52504 14.1083 5.52504 14.1083C6.25004 15.375 7.47504 15 7.95004 14.8C8.02504 14.2583 8.24171 13.8916 8.47504 13.6833C6.62504 13.475 4.68338 12.7583 4.68338 9.58331C4.68338 8.65831 5.00004 7.91664 5.54171 7.32498C5.45838 7.11664 5.16671 6.24998 5.62504 5.12498C5.62504 5.12498 6.32504 4.89998 7.91671 5.97498C8.57504 5.79164 9.29171 5.69998 10 5.69998C10.7084 5.69998 11.425 5.79164 12.0834 5.97498C13.675 4.89998 14.375 5.12498 14.375 5.12498C14.8334 6.24998 14.5417 7.11664 14.4584 7.32498C15 7.91664 15.3167 8.65831 15.3167 9.58331C15.3167 12.7666 13.3667 13.4666 11.5084 13.675C11.8084 13.9333 12.0834 14.4416 12.0834 15.2166V17.5C12.0834 17.725 12.2167 17.9916 12.6417 17.9166C15.95 16.8 18.3334 13.6833 18.3334 9.99998C18.3334 8.90563 18.1178 7.82199 17.699 6.81095C17.2803 5.7999 16.6664 4.88124 15.8926 4.10742C15.1188 3.3336 14.2001 2.71977 13.1891 2.30098C12.178 1.88219 11.0944 1.66664 10 1.66664V1.66664Z"
          ></path>
        </svg>
      </a>
    </div>
    <Logo />
    <div>
      <button @click="toggleColourBlindMode">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </button>
      <button @click="toggleDarkMode">
        <svg v-if="!darkMode" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.info {
  position: fixed;
  top: 52px;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  background: #fff;
  overflow-y: auto;
}

.dark .info {
  background: #18181B;
}

.info > div {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.info h2 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 10px;
}

.example, .divider {
  margin:  20px 0;
}

button, .button {
  vertical-align: top;
  display: inline-block;
  padding: 15px;
  transition: background-color 150ms ease-in-out;
}

button:hover, .button:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.dark button:hover, .dark .button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

p {
  margin-top: 10px;
}

header {
  height: 52px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  border-bottom: 1px solid #ccc;
  color: #000;
  text-align: center;
  background: #fff;
  padding: 1px 0;
  z-index: 10;
}

.merge-accounts-form {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
}

.merge-input {
  height: 2rem;
  padding: 6px;
  border: solid black 1px;
  background-color: rgb(245, 247, 248);
}

.dark .merge-input {
  color: black;
}

.merge-button {
  background-color: #27197d;
  color: white;
  font-weight: bold;
  margin-top: 10px;
}

.merge-button:hover {
  background-color: #3e2fa1;
}

.merge-button.merging {
  background-color: rgb(209, 204, 38) !important;
}

.merge-button.merged {
  background-color: rgb(39, 159, 103) !important;
}


.merge-error {
  text-align: center;
  background-color: rgb(248, 244, 225);
  padding: 10px;
}

.dark .merge-error {
  background-color: rgb(112, 0, 0);
  color: white;
}

.dark header {
  background: #18181B;
  color: #fff;
  border-color: #52525B;
}

@media (max-width: 715px) {
  button, .button {
    padding-left: 5px;
    padding-right: 5px;
  }
}
</style>
