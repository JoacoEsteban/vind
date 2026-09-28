import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root'
import { defineContentScript } from 'wxt/utils/define-content-script'
import Overlay from '~/contents/overlay.svelte'
import style from '~/style.scss?inline'

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'vind-overlay',
      position: 'inline',
      anchor: 'html',
      append: 'first',
      inheritStyles: true,
      css: style,
      onMount: (container) => {
        container.style.position = 'relative'
        container.style.zIndex = '2147483647'
        return new Overlay({ target: container })
      },
      onRemove: (overlay) => overlay?.$destroy(),
    })

    ui.mount()
  },
})
