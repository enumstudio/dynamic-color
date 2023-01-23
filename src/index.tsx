import { Theme as EmotionTheme, useTheme } from "@emotion/react";
import get from "lodash/get";
import { StyleSheet, Platform, DynamicColorIOS } from "react-native";
import type { DynamicColorIOSTuple } from "react-native";

// Utility types
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]];
type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${"" extends P ? "" : "."}${P}`
    : never
  : never;
type Leaves<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
  ? { [K in keyof T]-?: Join<K, Leaves<T[K], Prev[D]>> }[keyof T]
  : "";

type BaseTheme = {
  mode: "light" | "dark";
  highContrast?: boolean;
  highContrastLight?: any;
  highContrastDark?: any;
  light: any;
  dark: any;
}
type Theme = EmotionTheme extends BaseTheme ? EmotionTheme : BaseTheme;

type ColorString = string & {};
type Color = ColorString | Leaves<Theme> | DynamicColorIOSTuple;

type PatchedStyleSheet = typeof StyleSheet & {
  _flatten: typeof StyleSheet.flatten;
};

export type DynamicColorCallback = Color | ((props: { theme: Theme }) => Color);

// Render DynamicColorIOS as string for further processing
// in the StyleSheet.flatten function
export function DynamicColorIOSProperty(tuple: DynamicColorIOSTuple) {
  return `DynamicColor, '${JSON.stringify(tuple)}'`;
}

/**
 * Usage:
 * ```
 * DynamicColor({ light: '#fff', dark: '#000' })
 * DynamicColor({ light: 'text.primary', dark: '#112' })
 * DynamicColor('primary.text')
 * ```
 *
 * **Requirements**
 *
 * Emotion theme is required to have the following properties:
 *
 * ```
 * const theme = {
 *   mode: 'light' | 'dark',
 *   dark: Palette,
 *   light: Palette,
 * }
 * ```
 *
 * Also supports high contrast mode:
 *
 * ```
 * const theme = {
 *    ...
 *   highContrast: true | false,
 *   highContrastLight: Palette,
 *   highContrastDark: Palette,
 * }
 * ```
 */
export function DynamicColor(cb: DynamicColorCallback) {
  function getDynamicColor(props: { theme: Theme }) {
    // Get value as raw or by function
    const value = typeof cb === "function" ? cb(props) : cb;
    const { theme } = props;
    const isStringValue = typeof value === "string";
    const isHighContrast = theme.highContrast === true;

    const tuple = {
      light: isStringValue ? get(theme.light, value, value) : value.light,
      dark: isStringValue ? get(theme.dark, value, value) : value.dark,
      highContrastLight: isStringValue
        ? get(theme.highContrastLight, value)
        : value.highContrastLight,
      highContrastDark: isStringValue
        ? get(theme.highContrastDark, value)
        : value.highContrastDark,
    };

    if (Platform.OS === "android") {
      if (theme.mode === "dark") {
        if (isHighContrast && tuple.highContrastDark) {
          return tuple.highContrastDark;
        } else {
          return tuple.dark;
        }
      } else if (theme.mode === "light") {
        if (isHighContrast && tuple.highContrastLight) {
          return tuple.highContrastLight;
        } else {
          return tuple.light;
        }
      }
    } else if (Platform.OS === "ios") {
      return DynamicColorIOSProperty(
        typeof value === "string" ? tuple : (value as any)
      );
    }
    return "";
  }
  return getDynamicColor;
}

// Predicate to check if the value is a valid hex, hsl or rgb color.
// function isColorValue(color: ColorValue) {
//   if (typeof color === "string") {
//     return /(#([\da-f]{3}){1,2}|(rgb|hsl)a\((\d{1,3}%?,\s?){3}(1|0?\.\d+)\)|(rgb|hsl)\(\d{1,3}%?(,\s?\d{1,3}%?){2}\))/i.test(
//       color
//     );
//   } else if (typeof color === "object" && color !== null) {
//     return true;
//   }
//   return false;
// }

export function useDynamicColor() {
  const theme = useTheme() as Theme;
  return (cb: DynamicColorCallback) => DynamicColor(cb)({ theme });
}

export function applyDynamicColorSupport() {
  if ((StyleSheet as PatchedStyleSheet)._flatten) {
    return;
  }

  // Persist original StyleSheet.flatten function
  (StyleSheet as PatchedStyleSheet)._flatten = StyleSheet.flatten;

  // We take advantage of the flatten function to parse DynamicColorIOS tuples
  // passed to the style prop of a component, as @emotion/native uses this function
  // in the final step of processing styles.
  StyleSheet.flatten = (style) => {
    const props = (StyleSheet as PatchedStyleSheet)._flatten(style);
    for (const key in props) {
      const value = props[key];
      if (typeof value === "string") {
        const matches = value.match(/DynamicColor\, \'(.*)\'/);
        if (matches && matches[1]) {
          try {
            const tuple = JSON.parse(matches[1]);
            (props as any)[key] = DynamicColorIOS(tuple);
          } catch (err) {
            console.warn("failed to parse DynamicColor", value, err);
          }
        }
      }
    }
    return props;
  };
}

applyDynamicColorSupport();
