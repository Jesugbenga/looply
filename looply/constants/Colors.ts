/**
 * Colors for the app using the new dark theme design system
 * Import Theme from './Theme' for the full design system
 */

import { Theme } from './Theme';

const tintColorLight = Theme.colors.primary[500];
const tintColorDark = Theme.colors.primary[500];

export const Colors = {
  light: {
    text: Theme.colors.text.primary,
    background: Theme.colors.dark.background,
    tint: tintColorLight,
    icon: Theme.colors.text.secondary,
    tabIconDefault: Theme.colors.text.tertiary,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: Theme.colors.text.primary,
    background: Theme.colors.dark.background,
    tint: tintColorDark,
    icon: Theme.colors.text.secondary,
    tabIconDefault: Theme.colors.text.tertiary,
    tabIconSelected: tintColorDark,
  },
};
