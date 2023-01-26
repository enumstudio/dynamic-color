# Dynamic Color

![4D176908-79ED-44A3-B45F-F5946A2E6458](https://user-images.githubusercontent.com/180773/214712307-a229f027-c1ca-4cc3-962f-b79a9542da25.jpeg)
> ai generated artwork, "multicolor pen"

Dynamic Color is a library that allows you to easily implement dynamic colors in your React Native project that automatically change based on the current theme or accessibility settings, making the process more efficient and less error-prone. It requires you to set up a theme object with the colors you want to use, and then you can access them in your styling with the DynamicColor function.

```tsx
// Error: Implicit conversion of a 'symbol' to a 'string' will fail at runtime.
background-color: ${DynamicColorIOS({ light: 'white', dark: 'black' })};

// Good: with dynamic-color
background-color: ${DynamicColor({ light: 'white', dark: 'black' })};
```


## Installing

To install the dynamic-color library in your React Native project, you can use npm or yarn:

```bash
# Using npm
npm install —save dynamic-color

# Using yarn
yarn add dynamic-color
```

You will also need to install @emotion/react and @emotion/native if you want to use the library with styled components.

```bash
# Using npm
npm install —save @emotion/react @emotion/native

# Using yarn
yarn add @emotion/react @emotion/native
```

The library does not have any native impact to your project (for now) so there is no need to rebuild binaries.

### @emotion/react configuration

The library requires identical objects in your emotion theme that are selected based on selector keys (`mode` and `highContrast` for now).

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


## How it works

The `DynamicColor` function allows you to specify different color values for different theme modes (light, dark, and high contrast) in a single call. The function takes in an object with keys for each theme mode, and the corresponding value is the color to be used for that mode.

For example, the following code snippet:
```tsx
background-color: ${DynamicColor({  light:  'white',  dark:  'black'  })};
```

Will be converted into a string that looks like this:

```tsx
background-color:  color(DynamicColor,  '{"light":"white","dark":"black"}');
```

This string is then passed through the `StyleSheet.flatten()` function, which is patched to convert the css string `color(DynamicColor, '*')` back into `DynamicColorIOS`. This allows the `@emotion/native` library to correctly render the appropriate color based on the current theme mode.

## Usage

All of the available **DynamicColor** functions can be used in several ways to access colors from your theme object.

### Dot Notation

The most basic usage is to reference colors by dot notation. For example, in your theme object, you might have a property **primary** that holds the value of a color. You can access this color by calling `DynamicColor('primary')` in your styling.

```tsx
const Foo = styled.View`
  background-color: ${DynamicColor('primary')};
`
```

This will automatically resolve to the correct color based on the current mode and highContrast settings in your theme object.

### Object Notation

You can also pass an object to the DynamicColor function with specific colors for each color scheme or contrast setting. For example:

```tsx
const Bar = styled.View`
  color: ${DynamicColor({ light: '#fff', dark: '#111' })};
`
```

This will use the color #fff when the mode is set to light, and #111 when it's set to dark.

You can also specify colors for high contrast mode, by including highContrastLight and highContrastDark properties.

```tsx
const Bar = styled.View`
  color: ${DynamicColor({ light: '#ddd', highContrastLight: '#fff' })};
`
```

This will use the color #ddd when the mode is set to light and highContrast is false, and #fff when highContrast is true.


### Function Notation

You can also use a function to reference colors based on props or other variables. The function will be passed the props object, and should return either a string with a dot notation or an object with specific colors.

```tsx
const Baz = styled.View`
  color: ${DynamicColor(props => props.active
    ? { light: 'blue', dark: 'text.primary' }
    : 'text.primary'
  )};
`
```

This will use the color **blue** when the **props.active** is true and the **mode** is set to light, and **text.primary** when **props.active** is true and **mode** is set to dark or when **props.active** is false.

### Additional Usage

Please note that when already using props function inside a styled component, you need to pass the props object down to the DynamicColor function.

```tsx
const Button = styled.View`
  ${(props) => props.active && `
    background-color: ${DynamicColor('primary')(props)};
    color: ${DynamicColor('text.primary')(props)};
  `}
`
```

## useDynamicColor

React hook for use of dynamic colours directly in style properties or other direct props usage that supports `DynamicColorIOS`.

```tsx
import { useDynamicColor } from 'dynamic-color';

function Button() {
  const dynamicColor = useDynamicColor();
  return <Image
    tintColor={dynamicColor('primary.main')}
    style={{
      color: dynamicColor('primary.main')
    }}
  />
}
```

## withDynamicColor

You can use dynamic color outside of the React context with `withDynamicColor` function. The gotcha is that you will have to maintain theme and mode yourself.

```tsx
import { withDynamicColor } from 'dynamic-color';
import { theme } from './theme';

const dynamicColor = withDynamicColor({
  mode: Appearance.getColorScheme(),
  ...theme,
});

dynamicColor('primary.color');

// Easily update the theme with the merge feature
Appearance.addChangeListener(() =>
  dynamicColor.merge({ mode: Appearance.getColorScheme() }));

// Or set theme directly;
dynamicColor.theme.mode = 'dark';
```

## License

MIT