# Dynamic Color

Easily use dynamic colors in react native with @emotion/native, multi-platform **iOS** and **Android**.

Solves this problem:

```tsx
// Error: Implicit conversion of a 'symbol' to a 'string' will fail at runtime.
background-color: ${DynamicColorIOS({ light: 'white', dark: 'black' })};

// All OK!
background-color: ${DynamicColor({ light: 'white', dark: 'black' })};
```

## Emotion theme requirements

`dynamic-color` requires identical objects in your emotion theme that are selected based on selector keys (`mode` and `highContrast` for now).

```tsx
interface Palette {
  primary: string;
  text: {
    primary: string;
  }
}

const theme = {
  mode: 'light' | 'dark',
  dark: Palette,
  light: Palette,
}
```

Also supports high contrast mode:
```tsx
const theme = {
   ...
  highContrast: true | false,
  highContrastLight: Palette,
  highContrastDark: Palette,
}
```

Here is an example configuration:
```tsx
import { ThemeProvider } from '@emotion/react';
import { useColorScheme } from 'react-native';

function App() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider
      theme={{
        mode: colorScheme,
        light: {
          primary: '#0000ff',
          text: {
            primary: '#000000',
            secondary: '#121212',
          },
        },
        dark: {
          primary: '#00ffff',
          text: {
            primary: '#ffffff',
            secondary: '#cccccc',
          },
        },
        // (Optional)
        highContrast: false,
        highContrastLight: { ... },
        highContrastDark: { ... }
      }}
    >
      {children}
    </ThemeProvider>
  );
}
```

### DynamicColor Usage

```tsx
import styled from '@emotion/native';
import { DynamicColor } from 'dynamic-color';

// Easy access to theme values with dot notation
// Will resolve as #0000ff in light and #00ffff in dark.
const Foo = styled.View`
  background-color: ${DynamicColor('primary')};
  background-color: ${DynamicColor(({ theme }) => theme.primary)};
`

// Without using theme
const Bar = styled.View`
  color: ${DynamicColor({ light: '#fff', dark: '#111' })};
  color: ${DynamicColor({ light: '#ddd', highContrastLight: '#fff' })};
`

// Can also reference dot notations for each mode
const Baz = styled.View`
  color: ${DynamicColor({ light: 'text.primary', dark: 'text.secondary' })};
`;

// Also supports props function
const Bab = styled.View`
  color: ${DynamicColor(props => props.active
    ? { light: 'blue', dark: 'text.primary' }
    : 'text.primary'
  )};
`;

// When already using props function inside a styled component,
// remember to pass the theme down to the DynamicColor function.
const Button = styled.View`
  ${(props) => props.active && `
    background-color: ${DynamicColor('primary')(props)};
    color: ${DynamicColor('text.primary')(props)};
  `}
`;
```

### useDynamicColor Usage

Also provided is an react hook for use directly in style properties.

```tsx
import { useDynamicColor } from 'dynamic-color';

function Button() {
  const dynamicColor = useDynamicColor();
  return <View style={{
    color: dynamicColor('primary.main')
  }}>
}
```

### How does this work?

```tsx
background-color: ${DynamicColor({ light: 'white', dark: 'black' })};

// Will be converted into
background-color: DynamicColor, '{"light":"white","dark":"black"}';
```

Then `StyleSheet.flatten()` is patched to convert the css string `DynamicColor, '*'` back into `DynamicColorIOS`, because @styled/native will call this function in the final step of creating the stylesheet.


### Advanced usage

When outside of react scope, you can use the DynamicColor function but you need to pass in your theme.

You also need to pass rawDynamicColor to get real `DynamicColorIOS`.

```tsx
import { Appearance } from 'react-native';
import { DynamicColor } from 'dynamic-color';
import { theme } from './theme';

// Set your theme to correct mode
theme.mode = Appearance.getColorScheme();

// Generate your color with the props.
const myColor = DynamicColor('text.primary')({ theme, rawDynamicColor: true });

// Same as doing the following
const myColor = Platform.select({
  ios: DynamicColorIOS({ light: theme.light.text.primary, dark: theme.dark.text.primary }),
  android: Appearance.getColorScheme() === 'light' ? theme.light.text.primary : theme.dark.text.primary
});
```

You can create a utility function for this if you use it a lot:
```tsx
import { Appearance } from 'react-native';
import { DynamicColor } from 'dynamic-color';
import { theme } from './theme';

export const rawDynamicColor = (cb: DynamicColorCallback) => DynamicColor(cb)({
  theme: {
    mode: Appearance.getColorScheme(),
    ...theme,
  },
  rawDynamicColor: true,
});
```