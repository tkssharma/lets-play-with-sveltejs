<script lang="ts">
  import { Link } from 'svelte-routing'

  import type { Pokemon } from '../types'
  import DataBar from './DataBar.svelte'
  import PokemonSprites from './PokemonSprites.svelte'

  export let pokemon: Pokemon

  const femaleColor = 'pink-600'
  const maleColor = 'blue-500'
</script>

<div class="border border-gray-500 rounded-lg overflow-hidden">
  <!-- <pre>{JSON.stringify(pokemon, null, 2)}</pre> -->
  <header class="flex justify-between p-4 bg-gray-200 border-b border-gray-500">
    <h1 class="text-lg">{pokemon.name}</h1>
    <div>
      {#each pokemon.types as type (type.name)}
        <span
          class="inline-block ml-1 py-1 px-2 text-xs text-white tracking-wide
          rounded-full bg-{type.color}"
        >
          {type.name}
        </span>
      {/each}
    </div>
  </header>

  <div class="p-4">
    <p>{pokemon.description}</p>

    <div class="grid grid-cols-8 gap-2">
      <PokemonSprites sprites={pokemon.sprites} />
    </div>

    <div class="flex flex-col lg:flex-row mt-6">

      <div class="w-full lg:w-7/12">
        <section>
          <h2 class="text-lg font-bold">Profile</h2>
          <dl class="flex flex-wrap text-sm">
            <dt class="w-5/12">Species:</dt>
            <dd class="flex-grow w-7/12">{pokemon.species}</dd>
            <dt class="w-5/12">Height:</dt>
            <dd class="flex-grow w-7/12">
              {pokemon.height / 10} m ({Math.round((pokemon.height * 0.328084 + 0.00001) * 100) / 100}
              lb)
            </dd>
            <dt class="w-5/12">Weight:</dt>
            <dd class="flex-grow w-7/12">
              {pokemon.weight / 10} kg ({Math.round((pokemon.weight * 0.220462 + 0.00001) * 100) / 100}
              lb)
            </dd>
            <dt class="w-5/12">Abilities:</dt>
            <dd class="flex-grow w-7/12">{pokemon.abilities}</dd>
          </dl>
        </section>

        <section class="mt-6">
          <h2 class="text-lg font-bold">Training Stats</h2>
          <dl class="flex flex-wrap text-sm">
            <dt class="w-5/12">EV Yield:</dt>
            <dd class="flex-grow w-7/12">{pokemon.evs}</dd>
            <dt class="w-5/12">Capture Rate:</dt>
            <dd class="flex-grow w-7/12">{pokemon.captureRate}</dd>
            <dt class="w-5/12">Growth Rate:</dt>
            <dd class="flex-grow w-7/12">{pokemon.growthRate}</dd>
          </dl>
        </section>

        <section class="mt-6">
          <h2 class="text-lg font-bold">Breeding Stats</h2>
          <dl class="flex flex-wrap text-sm">
            <div class="flex items-center justify-center w-full">
              <dt class="w-5/12">Gender Ratio (%F / %M):</dt>
              <div class="w-7/12">
                <dd class="flex flex-grow h-4">
                  <DataBar
                    value={pokemon.genderRatio.female}
                    statColor={femaleColor}
                  />
                  <DataBar
                    value={pokemon.genderRatio.male}
                    statColor={maleColor}
                  />
                </dd>
              </div>
            </div>
            <dt class="w-5/12">Egg Groups:</dt>
            <dd class="flex-grow w-7/12">
              {#each pokemon.eggGroups as egg}{egg}{/each}
            </dd>
          </dl>
        </section>

      </div>

      <div class="w-full lg:w-5/12">
        <section class="mt-6 lg:mt-0">
          <h2 class="text-lg font-bold">Base Stats</h2>
          <dl>
            {#each pokemon.stats as stat}
              <div class="flex items-center">
                <dt class="w-4/12">{stat.name}</dt>
                <dd class="w-7/12 h-4 text-sm bg-gray-200 rounded">
                  <DataBar
                    value={stat.base_stat}
                    statColor={pokemon.pokemonTheme}
                  />
                </dd>
              </div>
            {/each}
          </dl>
        </section>

      </div>

    </div>
  </div>

  <footer class="flex justify-center w-full p-4 border-t border-gray-500">
    {#if pokemon.evolvesFrom}
      <p>
        {pokemon.name} evolves from
        <Link to="/{pokemon.evolvesFrom.url}">
          <span class="underline">{pokemon.evolvesFrom.name}</span>
        </Link>
      </p>
    {:else}
      <p>{pokemon.name} does not evolve from another Pokemon</p>
    {/if}
  </footer>
</div>
