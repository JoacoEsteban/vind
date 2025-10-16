<script lang="ts">
  import { Toaster } from 'svelte-french-toast/dist'
  import clsx from 'clsx'
  export let disabled = false
</script>

<Toaster
  containerClassName={clsx('made-tommy font-regular vind-ignore-*', {
    'force-ghost': disabled,
  })}
  toastOptions={{ className: 'bg-blur ghost vind-ignore-*' }} />
