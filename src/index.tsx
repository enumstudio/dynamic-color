import { Theme as EmotionTheme, useTheme } from "@emotion/react";
import get from "lodash/get";
import defaults from "lodash/defaults";
import { StyleSheet, Platform, DynamicColorIOS, ColorValue } from "react-native";
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
type Color = ColorString | Leaves<Theme["light"]> | DynamicColorIOSTuple;

type PatchedStyleSheet = typeof StyleSheet & {
  _flatten: typeof StyleSheet.flatten;
};

export type DynamicColorCallback = Color | ((props: { theme: Theme; rawDynamicColor?: boolean }) => Color);

// Render DynamicColorIOS as string for further processing
// in the StyleSheet.flatten function
export function DynamicColorIOSProperty(tuple: DynamicColorIOSTuple) {
  return `color(DynamicColor, '${JSON.stringify(tuple)}')`;
}

/**
 * Usage:
 * ```
 *  // Easy access to theme values with dot notation
 * DynamicColor('primary.text')
 * DynamicColor(({ theme }) => theme.primary.text)
 * 
 * // Statically typed
 * DynamicColor({ light: '#fff', dark: '#111' })
 * DynamicColor({ light: '#ddd', highContrastLight: '#fff' })
 * 
 * // Can also reference dot notations
 * DynamicColor({ light: 'text.primary', dark: 'text.secondary' })
 * 
 * // Also supports props function
 * DynamicColor(props => props.active
 *    ? { light: 'blue', dark: 'text.primary' }
 *    : 'text.primary'
 * )
 * 
 * // Remember to pass props when using functional styles
 * const Button = styled.View`
 *   ${(props) => props.active && `
 *     background-color: ${DynamicColor('primary.main')(props)};
 *     color: ${DynamicColor('text.primary')(props)};
 *   `}
 * `;
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
  function getDynamicColor(props: { theme: Theme; rawDynamicColor?: boolean }) {
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
      const dynamicTuple = typeof value === "string" ? tuple : (value as any);
      if (props.rawDynamicColor === true) {
        return DynamicColorIOS(dynamicTuple)
      } else {
        return DynamicColorIOSProperty(dynamicTuple);
      }
    }
    return "";
  }
  return getDynamicColor;
}

export function useDynamicColor(): (cb: DynamicColorCallback) => ColorValue {
  const theme = useTheme() as Theme;
  return (cb: DynamicColorCallback) => DynamicColor(cb)({ theme, rawDynamicColor: true });
}

export function withDynamicColor(theme: Theme, rawDynamicColor = true) {
  function getDynamicColor(cb: DynamicColorCallback) {
    return DynamicColor(cb)({
      theme: getDynamicColor.theme,
      rawDynamicColor: getDynamicColor.rawDynamicColor,
    });
  }
  getDynamicColor.theme = theme;
  getDynamicColor.rawDynamicColor = rawDynamicColor;
  getDynamicColor.merge = function(theme: Theme, rawDynamicColor = true) {
    getDynamicColor.theme = defaults(theme, getDynamicColor.theme);
    getDynamicColor.rawDynamicColor = rawDynamicColor;
  }
  return getDynamicColor;
}

const dynamicColor = withDynamicColor({ mode: "light", light: {}, dark: {} });
dynamicColor({ light: "red", dark: "blue" });
dynamicColor.merge({ mode: "dark", light: {}, dark: {} });

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
        const matches = value.match(/color(DynamicColor\, \'(.*)\')/);
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
