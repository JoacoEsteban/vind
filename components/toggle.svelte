<script lang="ts">
  import Button from './button.svelte'

  export let checked: boolean = false
  export let disabled: boolean = false
  export let opaque: boolean = false
  export let size: string = '25px'
</script>

<div class="toggle-container contents" class:checked style:--circle-size={size}>
  <Button
    {disabled}
    {opaque}
    on:click
    on:mouseover
    on:mouseleave
    on:focus
    on:blur>
    <div class="circle" class:checked></div>
    <!-- {checked ? 'on' : 'off'} -->
  </Button>
</div>
