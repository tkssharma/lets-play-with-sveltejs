<script lang="ts">
  export let amount: number = 1;
</script>

<div class="amount-button mt-1">
  <button on:click={() => amount > 1 && amount--} disabled={amount <= 1}>
    -
  </button>
  <div class="amount">{amount}</div>
  <button on:click={() => amount++}>+</button>
</div>

<style lang="scss">
  .amount-button {
    display: inline-flex;

    > * {
      width: 50px;
      background-color: whitesmoke;
      border-radius: 0;
      align-items: center;
      justify-content: center;
      padding: 5px;

      @media (prefers-color-scheme: dark) {
        background-color: var(--clr-black-halo);
      }
    }

    .amount {
      display: flex;
    }

    button {
      @media (prefers-color-scheme: dark) {
        color: var(--clr-white);
      }
    }

    button:first-child {
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
    }
    button:last-child {
      border-top-right-radius: 5px;
      border-bottom-right-radius: 5px;
    }
  }
</style>
