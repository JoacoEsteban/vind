import { SymbolComponent } from '~/lib/symbols'

export const bindingKeySymbolMap = new Map<
  string,
  string | ConstructorOfATypedSvelteComponent
>(
  Object.entries({
    ' ': '␣',
    Enter: '↵',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Backspace: SymbolComponent('deleteLeft', '2.5rem'),
  }),
)
