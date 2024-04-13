import { Record, String, Number, type Static } from 'runtypes'

import gearRaw from '~/assets/symbols/gear.json'
import arrowDownRaw from '~/assets/symbols/arrow.down.json'
import xMarkRaw from '~/assets/symbols/xmark.json'

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
] = [
  gearRaw,
  arrowDownRaw,
  xMarkRaw,
].map(checkSymbol)

export const symbols = {
  gear,
  arrowDown,
  xMark,
}