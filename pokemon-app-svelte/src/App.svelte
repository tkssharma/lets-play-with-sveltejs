<script lang="ts">
  import { Router, Link, Route } from 'svelte-routing'

  import Home from './routes/Home.svelte'
  import Detail from './routes/Detail.svelte'

  export let url = ''
</script>

<Router {url}>
  <header
    class="flex flex-col sm:flex-row items-center justify-between w-full
    bg-red-600 px-8 py-4"
  >
    <h1 class="text-2xl text-white uppercase">
      <Link to="/">Svelte PokeDex</Link>
    </h1>
    <p class="text-white">
      A Svelte REST API demo using the
      <a href="https://pokeapi.co/" class="text-white underline">PokéAPI</a>
    </p>
  </header>

  <main class="py-4">
    <Route path="/:id" component={Detail} />
    <Route path="/" component={Home} />
  </main>
</Router>
