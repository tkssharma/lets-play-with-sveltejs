<script lang="ts">
  import CartItem from "../components/CartItem.svelte";
  import { carts } from "../stores/Carts";

  $: pizzaCartTotal = $carts
    .map((pizza) =>
      !!pizza.discountPrice
        ? pizza.discountPrice * pizza.amount
        : pizza.price * pizza.amount
    )
    .reduce((pizzaA, pizzaB) => pizzaA + pizzaB, 0);

  $: topingsCartTotal = $carts
    .map((pizza) => pizza.topings.map((toping) => toping.price * pizza.amount))
    .flat()
    .reduce((pizzaA, pizzaB) => pizzaA + pizzaB, 0);
</script>

<div class="cart-wrapper">
  <h2>Cart ({$carts.length})</h2>
  <div class="pizza-list">
    {#each $carts as cart, index}
      <CartItem {index} item={cart} />
    {/each}
  </div>
  <div class="cart-total">
    Total <span class="price">${pizzaCartTotal + topingsCartTotal}</span>
  </div>
</div>
