import { z } from 'zod'

import gearRaw from '~/assets/symbols/gear.json'
import arrowDownRaw from '~/assets/symbols/arrow.down.json'
import xMarkRaw from '~/assets/symbols/xmark.json'
import trashFillRaw from '~/assets/symbols/trash.fill.json'
import sidebarRightRaw from '~/assets/symbols/sidebar.right.json'
import arrowTriangleBranchRaw from '~/assets/symbols/arrow.triangle.branch.json'
import linkRaw from '~/assets/symbols/link.json'
import cursorArrowClickRaw from '~/assets/symbols/cursorarrow.click.2.json'
import keyboardRaw from '~/assets/symbols/keyboard.json'
import squareAndArrowUpRaw from '~/assets/symbols/square.and.arrow.up.json'
import squareAndArrowDownRaw from '~/assets/symbols/square.and.arrow.down.json'
import listClipboardFillRaw from '~/assets/symbols/list.clipboard.fill.json'
import arrowDownRightAndArrowUpLeftRaw from '~/assets/symbols/arrow.down.right.and.arrow.up.left.json'
import arrowUpDocFillRaw from '~/assets/symbols/arrow.up.doc.fill.json'
import arrowDownDocFillRaw from '~/assets/symbols/arrow.down.doc.fill.json'
import plusRaw from '~/assets/symbols/plus.json'
import asteriskRaw from '~/assets/symbols/asterisk.json'
import asteriskCircleRaw from '~/assets/symbols/asterisk.circle.json'
import asteriskCircleFillRaw from '~/assets/symbols/asterisk.circle.fill.json'
import pencilRaw from '~/assets/symbols/pencil.json'
import pencilCircleFillRaw from '~/assets/symbols/pencil.circle.fill.json'
import deleteLeftFillRaw from '~/assets/symbols/delete.left.fill.json'
import deleteRightFillRaw from '~/assets/symbols/delete.right.fill.json'
import paintPaletteRaw from '~/assets/symbols/paintpalette.fill.json'
import arrowClockwiseRaw from '~/assets/symbols/arrow.clockwise.json'

import { default as SvelteSymbolComponent } from '~components/symbol.svelte'
import type { ComponentConstructorOptions } from 'svelte'

export const SymbolSchema = z.object({
  path: z.string(),
  geometry: z.object({
    width: z.number(),
    height: z.number(),
  }),
})
export type Symbol = z.infer<typeof SymbolSchema>

function checkSymbol(raw: unknown): Symbol {
  return SymbolSchema.parse(raw)
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
  squareAndArrowUp,
  squareAndArrowDown,
  listClipboardFill,
  arrowDownRightAndArrowUpLeft,
  arrowUpDocFill,
  arrowDownDocFill,
  plus,
  asterisk,
  asteriskCircle,
  asteriskCircleFill,
  pencil,
  pencilCircleFill,
  deleteLeftFill,
  deleteRightFill,
  paintPalette,
  arrowClockwise,
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
  squareAndArrowUpRaw,
  squareAndArrowDownRaw,
  listClipboardFillRaw,
  arrowDownRightAndArrowUpLeftRaw,
  arrowUpDocFillRaw,
  arrowDownDocFillRaw,
  plusRaw,
  asteriskRaw,
  asteriskCircleRaw,
  asteriskCircleFillRaw,
  pencilRaw,
  pencilCircleFillRaw,
  deleteLeftFillRaw,
  deleteRightFillRaw,
  paintPaletteRaw,
  arrowClockwiseRaw,
]
  .map(checkSymbol)
  .map((symbol) => {
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
      },
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
  squareAndArrowUp,
  squareAndArrowDown,
  listClipboardFill,
  arrowDownRightAndArrowUpLeft,
  arrowUpDocFill,
  arrowDownDocFill,
  plus,
  asterisk,
  asteriskCircle,
  asteriskCircleFill,
  pencil,
  pencilCircleFill,
  deleteLeftFill,
  deleteRightFill,
  paintPalette,
  arrowClockwise,
}
export type SymbolName = keyof typeof symbols

export function SymbolComponent(name: SymbolName, size: string = '100%') {
  return class extends SvelteSymbolComponent {
    constructor(
      arg: ComponentConstructorOptions<typeof SvelteSymbolComponent>,
    ) {
      const props = {
        ...arg.props,
        name,
        size,
      }

      super({
        ...arg,
        props,
      })
    }
  } as typeof SvelteSymbolComponent
}

export const SymbolComponents: Record<
  SymbolName,
  typeof SvelteSymbolComponent
> = (Object.keys(symbols) as SymbolName[]).reduce(
  (obj, name) => {
    obj[name as SymbolName] = SymbolComponent(name)
    return obj
  },
  {} as Record<SymbolName, typeof SvelteSymbolComponent>,
)
