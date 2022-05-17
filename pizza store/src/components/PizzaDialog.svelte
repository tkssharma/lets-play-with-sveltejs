<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import topings from "../constants/Topings";
  import type Pizza from "../constants/Pizza";
  import AmountButton from "./AmountButton.svelte";

  const emit = createEventDispatcher();

  let dialog: HTMLDialogElement | HTMLElement;
  let pizza: Pizza = {
    name: "",
    discountPrice: 0,
    price: 0,
    img: "",
  };
  let amount = 1;

  export let selectedTopingsId: Array<number> = [];

  export function open(_pizza: Pizza) {
    pizza = { ..._pizza };
    // @ts-ignore
    dialog.showModal();
    dialog.querySelector(".dialog-body").scrollTop = 0;
    document.body.classList.add("disable-scroll-y");
  }

  export function close(): void {
    // @ts-ignore
    dialog.close();
  }

  function addToCart() {
    emit("add-to-chart", { topings: selectedTopings, amount });
    onClose();
  }

  function onClose() {
    selectedTopingsId = [];
    amount = 1;
    document.body.classList.remove("disable-scroll-y");
  }

  function onClick(event: MouseEvent) {
    // @ts-ignore
    if (event.target.isSameNode(dialog)) {
      close();
    }
  }

  $: selectedTopings = selectedTopingsId.map((id) =>
    topings.find((toping) => toping.id === id)
  );

  $: totalSelectedTopings = selectedTopings.reduce(
    (prevPrice, topingB) => prevPrice + topingB.price,
    0
  );

  $: pizzaPriceBefore = (pizza.price + totalSelectedTopings) * amount;
  $: pizzaRealPrice =
    ((pizza.discountPrice ? pizza.discountPrice : pizza.price) +
      totalSelectedTopings) *
    amount;
</script>

<dialog
  class="dialog-wrapper"
  bind:this={dialog}
  on:close={onClose}
  on:cancel={onClose}
  on:click={onClick}
>
  <div class="dialog">
    <h2>{pizza.name}</h2>

    <div class="dialog-body">
      <img
        class="pizza-img"
        src="./images/{pizza.img}"
        alt={pizza.name}
        title={pizza.name}
      />

      <div class="pizza-prices">
        {#if pizza.discountPrice}
          <span class="pizza-price-before">
            ${pizzaPriceBefore.toFixed(1)}
          </span>
        {/if}
        <div class="pizza-price">
          ${pizzaRealPrice.toFixed(1)}
        </div>
      </div>

      <h3 class="mt-1">Select topings</h3>
      <div class="toping-list">
        {#each topings as toping, index}
          <div class="toping-list-item">
            <label>
              <input
                type="checkbox"
                name="topings"
                bind:group={selectedTopingsId}
                value={toping.id}
              />
              <span class="toping-list-item-name">
                {toping.label} (${toping.price})
              </span>
            </label>
          </div>
        {/each}
      </div>

      <h3 class="mt-1">Amount</h3>

      <AmountButton bind:amount />
    </div>

    <div class="modal-actions">
      <button on:click={close}>Cancel</button>
      <button class="add-to-cart-button-on-modal" on:click={addToCart}>
        Add to cart
      </button>
    </div>
  </div>
</dialog>
