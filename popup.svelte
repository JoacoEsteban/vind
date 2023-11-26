<script lang="ts">
  import { onMount } from "svelte";
  import { getBindingsForSite, Binding } from "~lib/binding";
  import { sendToContentScript } from "@plasmohq/messaging";

  let bindings: Binding[] = [];
  async function loadCurrentBindings() {
    bindings = await getBindingsForSite(new URL(location.href));
  }

  async function register() {
    sendToContentScript({ name: "register" });
  }

  onMount(() => {
    loadCurrentBindings();
  });
</script>

<div>
  <h2 class="text-center">Vind</h2>
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
      <button on:click="{register}">Click to register</button>
    </div>
  </div>
</div>

<style>
  .container {
    min-width: 470px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 47px;
  }
  .text-center {
    text-align: center;
  }
</style>
