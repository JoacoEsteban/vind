<script>
  import { getPlatform } from '~lib/misc'
  import { match } from 'ts-pattern'

  const platform = getPlatform()
  const modifier = match(platform)
    .with('mac', () => '⌥ option')
    .otherwise(() => 'alt')
</script>

<div class="prose dark:prose-invert space-y-1">
  <div>Click the button you want to bind</div>
  <div class="text-sm">
    <b>Hint:</b> Hold <code>{modifier}</code>
    {'to disable the highlight and keep navigating the page'}
  </div>
</div>
