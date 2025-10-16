import SelectingElement from '~components/messages/selecting-element.svelte'
import { RegistrationState } from './registration-controller'
import { SymbolComponent, type SymbolName } from './symbols'
import type { Renderable } from 'svelte-french-toast'

const iconSize = '2.5em'

export const registrationStateToastOptions: {
  [key in RegistrationState]: {
    text: string | Renderable
    icon: ReturnType<typeof SymbolComponent>
  } | null
} = {
  [RegistrationState.Idle]: null,
  [RegistrationState.SavingBinding]: null,
  [RegistrationState.SelectingElement]: {
    text: SelectingElement,
    icon: SymbolComponent('cursorArrowClick', iconSize),
  },
  [RegistrationState.SelectingKey]: {
    text: 'Press the key you want to bind the button to',
    icon: SymbolComponent('keyboard', iconSize),
  },
}

export const colorSeeds = {
  redCancel: '10a',
  greenAccept: '67',
}

export enum Messages {
  UncaughtError = 'An unexpected error just happened. If it persists, please contact us at support@vind-works.io',
}
