<script type="ts">
  import type Pizza from "src/constants/Pizza";
  import { createEventDispatcher } from "svelte";

  const emit = createEventDispatcher();

  export let item: Pizza;
</script>

<div class="pizza-item">
  <img
    src="./images/pizza-placeholder.png"
    class="lazy"
    data-src="./images/{item.img}"
    alt={item.name}
  />
  <div class="pizza-name-and-price-wrapper">
    <h3 class="pizza-name">{item.name}</h3>
    <div class="pizza-prices">
      {#if item.discountPrice}
        <div class="pizza-price-before">${item.price}</div>
      {/if}
      <div class="pizza-price">
        ${item.discountPrice ? item.discountPrice : item.price}
      </div>
    </div>
  </div>
  <button
    on:click={() => emit("add-to-cart")}
    type="button"
    class="add-to-cart-button"
    title="Add to cart"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      version="1.1"
      x="0px"
      y="0px"
      width="15px"
      height="15px"
      viewBox="0 0 309.059 309.059"
      style="enable-background:new 0 0 309.059 309.059;"
      xml:space="preserve"
    >
      <g>
        <g>
          <path
            style="current-color"
            d="M280.71,126.181h-97.822V28.338C182.889,12.711,170.172,0,154.529,0S126.17,12.711,126.17,28.338 v97.843H28.359C12.722,126.181,0,138.903,0,154.529c0,15.621,12.717,28.338,28.359,28.338h97.811v97.843    c0,15.632,12.711,28.348,28.359,28.348c15.643,0,28.359-12.717,28.359-28.348v-97.843h97.822    c15.632,0,28.348-12.717,28.348-28.338C309.059,138.903,296.342,126.181,280.71,126.181z"
          />
        </g>
      </g>
      <g />
      <g />
      <g />
      <g />
      <g />
      <g />
      <g />
      <g />
      <g />
      <g />
      <g />
      <g />
      <g />
      <g />
      <g />
    </svg>
  </button>
</div>
