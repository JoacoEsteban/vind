<script lang="ts">
  import './style.css'
  import { onMount } from 'svelte'
  import { askForBinding } from '~/messages'
  import { Binding, getBindingsForSite } from '~lib/binding'

  let bindings: Binding[] = []
  async function loadCurrentBindings() {
    bindings = await getBindingsForSite(new URL(location.href))
  }

  async function registerNewBinding() {
    askForBinding()
  }

  onMount(() => {
    loadCurrentBindings()
  })
</script>

<div>
  <h2 class="text-center px-5 py-2.5">Vind</h2>
  <div class="container">
    <div>
      <h3>Current bindings</h3>
      {#each bindings as binding}
        <div>
          <span>{binding.key}</span>
        </div>
      {/each}
    </div>
    <div>
      <button class="btn btn-danger" on:click={registerNewBinding}
        >Click to register</button>
    </div>
  </div>
</div>

<style>
  .container {
    min-width: 470px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 47px;
  }
  .text-center {
    text-align: center;
  }
</style>
