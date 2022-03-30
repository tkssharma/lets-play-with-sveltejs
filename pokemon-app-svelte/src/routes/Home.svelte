<script lang="ts">
  import ky from 'ky'

  import PokemonCard from '../components/PokemonCard.svelte'

  let pokemons = []
  let offset = 0
  let amountToLoad = 24

  interface Data {
    results: []
  }

  $: {
    getPokemon(offset, amountToLoad)
  }

  async function getPokemon(off: number, amt: number) {
    let url = `https://pokeapi.co/api/v2/pokemon?offset=${off}&limit=${amt}`
    const data: Data = await ky.get(url).json()

    pokemons = [...pokemons, ...data.results]
  }

  function handleMoreClick() {
    offset += amountToLoad
  }
</script>

<div class="container">
  <ul class="grid sm:grid-cols-2 md:grid-cols-3 sm:col-gap-6 row-gap-4">
    {#each pokemons as { name, url } (url)}
      <li>
        <PokemonCard {name} {url} />
      </li>
    {/each}
  </ul>

  {#if pokemons.length > 0}
    <button
      class="border border-red-700 font-bold hover:bg-red-700 hover:text-white
      px-4 py-2 rounded text-red-700"
      type="button"
      id="more-button"
      on:click={handleMoreClick}
    >
      Load More
    </button>
  {/if}
</div>
