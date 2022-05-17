import type Pizza from "../constants/Pizza";
import { Writable, writable } from "svelte/store";


export const carts: Writable<Array<Pizza>> = writable(
);


export function removeFromCart(index: number) {
  carts.update((oldcart) => {
    oldcart.splice(index, 1);
    return oldcart;
  });
}
