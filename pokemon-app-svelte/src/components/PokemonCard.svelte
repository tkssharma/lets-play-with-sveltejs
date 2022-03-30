<script lang="ts">
  import { Link, link } from 'svelte-routing'
  import { toTitleCase } from '../utils.js'

  export let name: string
  export let url: string

  const urlArray = url.split('/')
  const indexLocation = urlArray.length - 2

  const index = urlArray[indexLocation]

  const imgurl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index}.png`
</script>

<article
  class="flex flex-col items-center max-w-sm border-red-600 border-t-8 rounded
  overflow-hidden shadow-lg"
>
  <header class="px-6 py-4">
    <h2 class="font-bold text-xl mb-2">
      <Link href="/{index}">{toTitleCase(name, '-')}</Link>
    </h2>
  </header>
  <img class="w-24 h-24" src={imgurl} alt="" />
  <footer class="flex justify-end w-full">
    <a
      href="/{index}"
      class="p-2 text-red-600 hover:text-red-700 cursor-pointer"
      use:link
    >
      <svg fill="none" viewBox="0 0 16 16" class="w-6 h-6 fill-current">
        <path
          d="M8 9.986H3a1 1 0 01-1-1v-2a1 1 0 011-1h5v-2a1 1 0 011.7-.7l4 4a1 1
          0 010 1.4l-4 4a1 1 0 01-1.7-.7v-2z"
        />
      </svg>
    </a>
  </footer>
</article>
