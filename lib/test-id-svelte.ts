import type { ComponentConstructorOptions } from 'svelte'
import SvelteTestIdWrapComponent from 'components/test-id-wrap.svelte'
import type { Renderable } from '~lib/svelte'
import type { TestId } from '~lib/test-id'

export const Render = (SlotComponent: Renderable) => ({
  withId<Name extends string | number>(testId: TestId<Name>) {
    return class extends SvelteTestIdWrapComponent {
      constructor(
        arg: ComponentConstructorOptions<typeof SvelteTestIdWrapComponent>,
      ) {
        super({
          ...arg,
          props: {
            ...arg.props,
            testId,
            SlotComponent,
          },
        })
      }
    }
  },
})
