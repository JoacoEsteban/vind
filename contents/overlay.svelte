<script context="module" lang="ts">
  import styleText from 'data-text:~/style.css'
  import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo'

  export const config: PlasmoCSConfig = {
    matches: ['<all_urls>'],
  }

  export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement('style')
    style.textContent = styleText
    return style
  }
</script>

<script lang="ts">
  import { askForBindingStream } from '~/messages'

  let showBindingTargetOverlay = false

  function register() {
    showBindingTargetOverlay = true
  }

  askForBindingStream.subscribe(register)
</script>

<div class="hw-top">
  <h1>Vind Overlay</h1>
  {#if showBindingTargetOverlay}
    <h2>Registering new binding</h2>
  {/if}
</div>
