import { create } from 'storybook/theming/create'
import type { ThemeVars } from 'storybook/theming'
import dreiLogo from './drei.jpeg'

// Annotated explicitly: `declaration: true` is on repo-wide, and an inferred
// return here trips TS4082 because `ThemeVars` is not nameable from this module.
const theme: ThemeVars = create({
  base: 'light',
  brandImage: dreiLogo,
  appBg: 'white',
})

export default theme
