<script lang="ts">
  import type Pizza from "src/constants/Pizza";
  import { removeFromCart } from "../stores/Carts";

  export let item: Pizza;
  export let index: number;

  $: totalTopingPrice = item.topings
    .map((toping) => toping.price)
    .reduce((topingA, topingB) => topingA + topingB, 0);
  $: pizzaPrice = item.discountPrice ? item.discountPrice : item.price;
</script>

<div class="pizza-cart-item">
  <img src="./images/{item.img}" alt={item.name} />
  <button
    class="btn-delete-pizza-cart-item"
    title="Delete pizza from cart"
    on:click={() => removeFromCart(index)}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="#fff"
      viewBox="0 0 24 24"
      width="15.5px"
      height="15.5px"
      ><path
        d="M 10.806641 2 C 10.289641 2 9.7956875 2.2043125 9.4296875 2.5703125 L 9 3 L 4 3 A 1.0001 1.0001 0 1 0 4 5 L 20 5 A 1.0001 1.0001 0 1 0 20 3 L 15 3 L 14.570312 2.5703125 C 14.205312 2.2043125 13.710359 2 13.193359 2 L 10.806641 2 z M 4.3652344 7 L 5.8925781 20.263672 C 6.0245781 21.253672 6.877 22 7.875 22 L 16.123047 22 C 17.121047 22 17.974422 21.254859 18.107422 20.255859 L 19.634766 7 L 4.3652344 7 z"
      /></svg
    >
  </button>
  <div class="pizza-name-and-price-wrapper">
    <h3 class="pizza-name">
      {item.name}
      {#if item.amount > 1}
        (x{item.amount})
      {/if}
    </h3>
    <div class="pizza-topings">
      {item.topings.map((toping) => toping.label).join(", ")}
    </div>
    <div class="pizza-prices">
      <div class="pizza-price">
        ${(totalTopingPrice + pizzaPrice) * item.amount}
      </div>
    </div>
  </div>
</div>
