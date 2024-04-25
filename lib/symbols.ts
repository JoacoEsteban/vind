import { Record as RTRecord, String, Number, type Static } from 'runtypes'

import gearRaw from '~/assets/symbols/gear.json'
import arrowDownRaw from '~/assets/symbols/arrow.down.json'
import xMarkRaw from '~/assets/symbols/xmark.json'
import trashFillRaw from '~/assets/symbols/trash.fill.json'
import sidebarRightRaw from '~/assets/symbols/sidebar.right.json'
import arrowTriangleBranchRaw from '~/assets/symbols/arrow.triangle.branch.json'
import linkRaw from '~/assets/symbols/link.json'
import cursorArrowClickRaw from '~/assets/symbols/cursorarrow.click.2.json'
import keyboardRaw from '~/assets/symbols/keyboard.json'

import { default as SvelteSymbolComponent } from '~components/symbol.svelte'
import type { ComponentConstructorOptions } from 'svelte'

export const SymbolSchema = RTRecord({
  path: String,
  geometry: RTRecord({
    width: Number,
    height: Number,
  })
})
export type Symbol = Static<typeof SymbolSchema>

function checkSymbol (raw: any): Symbol {
  return SymbolSchema.check(raw)
}

const [
  gear,
  arrowDown,
  xMark,
  trashFill,
  sidebarRight,
  arrowTriangleBranch,
  link,
  cursorArrowClick,
  keyboard,
] = [
  gearRaw,
  arrowDownRaw,
  xMarkRaw,
  trashFillRaw,
  sidebarRightRaw,
  arrowTriangleBranchRaw,
  linkRaw,
  cursorArrowClickRaw,
  keyboardRaw,
]
  .map(checkSymbol)
  .map(symbol => {
    const sizes = { ...symbol.geometry }
    const max = Math.max(sizes.width, sizes.height)

    const wRatio = sizes.width / max
    const hRatio = sizes.height / max

    return {
      ...symbol,
      geometry: {
        ...symbol.geometry,
        wRatio,
        hRatio,
      }
    }
  })

export const symbols = {
  gear,
  arrowDown,
  xMark,
  trashFill,
  sidebarRight,
  arrowTriangleBranch,
  link,
  cursorArrowClick,
  keyboard,
}
export type SymbolName = keyof typeof symbols

export function SymbolComponent (name: SymbolName, size: string = '100%') {
  return class extends SvelteSymbolComponent {
    constructor(arg: ComponentConstructorOptions<typeof SvelteSymbolComponent>) {
      const props = {
        ...arg.props,
        name,
        size
      }

      super({
        ...arg,
        props,
      })
    }
  } as typeof SvelteSymbolComponent
}

export const SymbolComponents: Record<SymbolName, typeof SvelteSymbolComponent> = (Object.keys(symbols) as SymbolName[])
  .reduce((obj, name) => {
    obj[name as SymbolName] = SymbolComponent(name)
    return obj
  }, {} as Record<SymbolName, typeof SvelteSymbolComponent>)