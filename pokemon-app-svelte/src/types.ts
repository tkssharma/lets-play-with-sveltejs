export interface Pokemon {
  name: string
  types: { name: string; color: string }[]
  description: string
  sprites: Sprites
  stats: {
    name: string
    base_stat: number
  }[]
  height: number
  weight: number
  captureRate: number
  growthRate: string
  genderRatio: {
    female: number
    male: number
  }
  eggGroups: string
  abilities: string
  evs: string
  evolvesFrom: Resource
  pokemonTheme: string
  species: string
}

export interface PokemonGeneral {
  name: string
  types: { slot: number; type: Resource }[]
  sprites: Sprites
  stats: {
    stat: Resource
    effort: number
    base_stat: number
  }[]
  abilities: {
    is_hidden: boolean
    slot: number
    ability: Resource
  }[]
  height: number
  weight: number
}

export interface PokemonSpecies {
  flavor_text_entries: FlavorText[]
  capture_rate: number
  growth_rate: Resource
  gender_rate: number
  egg_groups: Resource[]
  evolves_from_species: Resource
  genera: { genus: string; language: Resource }[]
}

export interface Resource {
  name: string
  url: string
}

export interface Sprites {
  front_default: string
  front_shiny: string
  front_female: string
  front_shiny_female: string
  back_default: string
  back_shiny: string
  back_female: string
  back_shiny_female: string
}
export interface FlavorText {
  flavor_text: string
  language: Resource
  version: Resource
}
