<script>
import {createEventDispatcher} from 'svelte'
import Button from './button.svelte'

export let bookTitle;
export let bookPages;
export let bookDescription;

const dispatch =  createEventDispatcher()
function purchaseBook(){
    dispatch('buy', bookTitle)
}
</script>

<style>
div{
    margin: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.26)
}
h1{
    font-size: 1.25rem;
    margin: 0.25rem 0;
}
h2{
    font-size: 1rem;
    margin: 0.25rem 0;
    color: aqua;
}
p{
    margin: 0.25rem 0;
}
</style>

<div>
    <h1> {bookTitle} </h1>
    <h2> {bookPages} </h2>
    <p> {bookDescription} </p>
    <Button on:click={purchaseBook}>Buy</Button>
</div>