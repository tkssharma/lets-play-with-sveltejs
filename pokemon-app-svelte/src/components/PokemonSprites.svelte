<script lang="ts">
  import type { Sprites } from '../types'

  export let sprites: Sprites
</script>

{#if sprites.front_default}
  <img alt="" src={sprites.front_default} />
{/if}
{#if sprites.back_default}
  <img alt="" src={sprites.back_default} />
{/if}

{#if sprites.front_female}
  <img alt="" src={sprites.front_female} />
{/if}
{#if sprites.back_female}
  <img alt="" src={sprites.back_female} />
{/if}

{#if sprites.front_shiny}
  <img alt="" src={sprites.front_shiny} />
{/if}
{#if sprites.back_shiny}
  <img alt="" src={sprites.back_shiny} />
{/if}

{#if sprites.front_shiny_female}
  <img alt="" src={sprites.front_shiny_female} />
{/if}
{#if sprites.back_shiny_female}
  <img alt="" src={sprites.back_shiny_female} />
{/if}
