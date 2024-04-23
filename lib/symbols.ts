import { Record, String, Number, type Static } from 'runtypes'

import gearRaw from '~/assets/symbols/gear.json'
import arrowDownRaw from '~/assets/symbols/arrow.down.json'
import xMarkRaw from '~/assets/symbols/xmark.json'
import trashFillRaw from '~/assets/symbols/trash.fill.json'
import sidebarRightRaw from '~/assets/symbols/sidebar.right.json'
import arrowTriangleBranchRaw from '~/assets/symbols/arrow.triangle.branch.json'
import linkRaw from '~/assets/symbols/link.json'

export const SymbolSchema = Record({
  path: String,
  geometry: Record({
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
] = [
  gearRaw,
  arrowDownRaw,
  xMarkRaw,
  trashFillRaw,
  sidebarRightRaw,
  arrowTriangleBranchRaw,
  linkRaw,
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
}

export type SymbolName = keyof typeof symbols