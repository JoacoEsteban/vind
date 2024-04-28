import { RegistrationState } from './registration-controller'
import { SymbolComponent, type SymbolName } from './symbols'

const iconSize = '2em'

export const registrationStateToastOptions: {
  [key in RegistrationState]: { text: string; icon: ReturnType<typeof SymbolComponent> } | null
} = {
  [RegistrationState.Idle]: null,
  [RegistrationState.SavingBinding]: null,
  [RegistrationState.SelectingElement]: {
    text: 'Click the button you want to bind',
    icon: SymbolComponent('cursorArrowClick', iconSize),
  },
  [RegistrationState.SelectingKey]: {
    text: 'Press the key you want to bind the button to',
    icon: SymbolComponent('keyboard', iconSize),
  },
}