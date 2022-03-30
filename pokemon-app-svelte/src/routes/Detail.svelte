<script lang="ts">
  import ky from 'ky'

  import PokemonDetail from '../components/PokemonDetail.svelte'

  import type {
    Pokemon,
    PokemonGeneral,
    PokemonSpecies,
    Resource,
    FlavorText,
  } from '../types'
  import { TYPE_COLORS } from '../constants'
  import { toTitleCase } from '../utils'

  export let id: number
  export let pokemon: Pokemon

  let loading = false
  let error: string

  //$: getPokemon(id)
  function getFlavorText(flavors: FlavorText[]): string {
    // RANDOM FLAVOR TEXT
    let tempDescription = []
    tempDescription = flavors
      .filter((flavor) => flavor.language.name === 'en')
      .map((item) => item.flavor_text)

    const num = Math.floor(Math.random() * tempDescription.length)

    return tempDescription[num]
  }

  async function getPokemon(id: number) {
    const pokemonURL = `https://pokeapi.co/api/v2/pokemon/${id}/`
    const pokemonSpeciesURL = `https://pokeapi.co/api/v2/pokemon-species/${id}/`

    try {
      loading = true
      const pokemonGeneral: PokemonGeneral = await ky.get(pokemonURL).json()
      const pokemonSpecies: PokemonSpecies = await ky
        .get(pokemonSpeciesURL)
        .json()

      const {
        name,
        types,
        sprites,
        stats,
        abilities,
        height,
        weight,
      } = pokemonGeneral

      const {
        flavor_text_entries,
        capture_rate,
        growth_rate,
        gender_rate,
        egg_groups,
        evolves_from_species,
        genera,
      } = pokemonSpecies

      // POKEMON THEME (use the last type in the types array to determine)
      const pokemonTheme = TYPE_COLORS[types[types.length - 1].type.name]

      // GENDER RATIO
      const genderRate = gender_rate
      const genderRatio = {
        female: 12.5 * genderRate,
        male: 12.5 * (8 - genderRate),
      }

      //EGG GROUPS
      const eggGroups = egg_groups
        .map((group) => toTitleCase(group.name, ' '))
        .join(', ')

      // ABILITIES
      const formattedAbilities = abilities
        .map((ability) => toTitleCase(ability.ability.name, '-'))
        .join(', ')

      // Effort Values
      const evs = stats
        // filter out stats where effort is 0
        .filter((stat) => {
          if (stat.effort > 0) {
            return true
          }
          return false
        })
        .map((stat) => `${stat.effort} ${toTitleCase(stat.stat.name, '-')}`)
        .join(', ')

      // EVOLUTION
      let evolvesFrom: Resource
      if (evolves_from_species) {
        evolvesFrom = {
          name: toTitleCase(evolves_from_species.name, ' '),
          url: evolves_from_species.url.split('/')[
            evolves_from_species.url.split('/').length - 2
          ],
        }
      } else {
        evolvesFrom = undefined
      }

      const formattedStats = stats.map((stat) => {
        return {
          name: toTitleCase(stat.stat.name, '-'),
          base_stat: stat.base_stat,
        }
      })

      // Species Variety
      const species = genera.filter((g) => g.language.name === 'en')[0].genus

      loading = false

      pokemon = {
        name: toTitleCase(name, ' '),
        types: types.map((type) => ({
          name: toTitleCase(type.type.name, ' '),
          color: TYPE_COLORS[type.type.name.toLowerCase()],
        })),
        description: getFlavorText(flavor_text_entries),
        sprites,
        stats: formattedStats,
        height,
        weight,
        captureRate: capture_rate,
        growthRate: toTitleCase(growth_rate.name, '-'),
        genderRatio,
        eggGroups,
        abilities: formattedAbilities,
        evs,
        evolvesFrom,
        pokemonTheme,
        species,
      }
    } catch (e) {
      const serverMessage = await e.response.text()
      loading = false
      error = serverMessage
    }
  }
</script>

<div class="container">
  {#if error}{error}{/if}
  {#if pokemon}
    <div class="w-full md:w-11/12 mx-auto">
      <PokemonDetail {pokemon} />
    </div>
  {:else if loading}LOADING{/if}
</div>
