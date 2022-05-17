<script lang="ts">
  import Item from "./components/Item.svelte";
  import PizzaDialog from "./components/PizzaDialog.svelte";
  import { carts } from "./stores/Carts";
  import pizzas from "./constants/Pizzas";
  import type Pizza from "./constants/Pizza";
  import Carts from "./components/Carts.svelte";

  let pizzaDialog: PizzaDialog;

  let currentSelectedPizza: Pizza = null;

  function openPizzaDialog(pizza: Pizza) {
    currentSelectedPizza = { ...pizza };
    pizzaDialog.open(currentSelectedPizza);
  }

  function addToCart({ detail }) {
    currentSelectedPizza.topings = detail.topings;
    currentSelectedPizza.amount = detail.amount;
    carts.update((prevCarts) => [...prevCarts, currentSelectedPizza]);
    pizzaDialog.close();
  }
</script>

<heading class="main-heading">
  <h1>Pizza Store</h1>
</heading>

<div class="pizza-store-main">
  <div class="pizza-list-wrapper">
    <h2>Pizza List</h2>
    <div class="pizza-list">
      {#each pizzas as pizza}
        <Item item={pizza} on:add-to-cart={() => openPizzaDialog(pizza)} />
      {/each}
    </div>
  </div>

  <Carts />

  <PizzaDialog bind:this={pizzaDialog} on:add-to-chart={addToCart} />
</div>

<footer class="footer">
  Developed with ❤️ by <a target="_blank" href="https://github.com/donnisnoni">
    Don Alfons Nisnoni
  </a>
</footer>
