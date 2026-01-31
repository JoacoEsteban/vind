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
  }),
)
