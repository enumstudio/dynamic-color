import { DynamicColorIOSProperty, DynamicColor, useDynamicColor, withDynamicColor } from '../src';
import { DynamicColorIOS, Platform, StyleSheet, Text } from 'react-native';
import * as React from 'react';
import { render, screen } from '@testing-library/react-native';
import styled, { css } from '@emotion/native';
import { ThemeProvider } from '@emotion/react';

Platform.OS = 'android';

const exampleTuple = { light: '#012', dark: '#fde' };
const exampleTheme = {
  mode: 'light' as const,
  light: { primary: { main: '#012' } },
  dark: { primary: { main: '#fde' } },
};


describe('DynamicColor', () => {
  test('DynamicColorIOSProperty', () => {
    expect(DynamicColorIOSProperty({ light: '#000', dark: '#fff' })).toBe(
      `color(DynamicColor, '{"light":"#000","dark":"#fff"}')`
    );
  });

  test('Android', () => {
    const obj: any = DynamicColor(exampleTuple);
    expect(obj({ theme: { mode: 'light' } })).toBe(exampleTuple.light);
    expect(obj({ theme: { mode: 'dark' } })).toBe(exampleTuple.dark);
  });

  test('iOS', () => {
    Platform.OS = 'ios';
    const obj: any = DynamicColor(exampleTuple);
    const str = `color(DynamicColor, '{"light":"#012","dark":"#fde"}')`;
    expect(obj({ theme: { mode: 'light' } })).toBe(str);
    expect(obj({ theme: { mode: 'dark' } })).toBe(str);
    Platform.OS = 'android';
  });

  test('theming', () => {
    const colorLight = DynamicColor('primary.main')({
      theme: {
        mode: 'light',
        light: { primary: { main: 'red' } },
        dark: { primary: { main: 'blue' } },
      },
    } as any);
    expect(colorLight).toBe('red');
    const colorDark = DynamicColor('primary.main')({
      theme: {
        mode: 'dark',
        light: { primary: { main: 'red' } },
        dark: { primary: { main: 'blue' } },
      },
    } as any);
    expect(colorDark).toBe('blue');
    const colorHighContrast = DynamicColor('primary.main')({
      theme: {
        mode: 'dark',
        highContrast: true,
        light: { primary: { main: 'red' } },
        dark: { primary: { main: 'blue' } },
        highContrastDark: { primary: { main: 'pink' } },
      },
    } as any);
    expect(colorHighContrast).toBe('pink');
    const colorHighContrastFallback = DynamicColor('primary.main')({
      theme: {
        mode: 'dark',
        highContrast: true,
        light: { primary: { main: 'red' } },
        dark: { primary: { main: 'blue' } },
      },
    } as any);
    expect(colorHighContrastFallback).toBe('blue');
  });

  test('short-hands', () => {
    Platform.OS = 'ios';
    const color = DynamicColor('primary.main')({theme: exampleTheme, rawDynamicColor:false });
    const colors = css`
      color: ${color};
      background: ${color};
      border: 1px solid ${color};
      text-decoration: underline solid ${color};
      // overwrites
      border-top-color: red;
    `;
    expect(colors.backgroundColor).toStrictEqual(DynamicColorIOS(exampleTuple));
    expect(colors.borderColor).toStrictEqual(DynamicColorIOS(exampleTuple));
    expect(colors.borderTopColor).toStrictEqual('red');
    Platform.OS = 'android';
  })

  test('useDynamicColor', async () => {
    const App = () => {
      const dynamicColor = useDynamicColor();
      return <Text testID="app">{dynamicColor('primary.main').toString()}</Text>;
    };
    const { rerender } = render(
      <ThemeProvider
        theme={
          {
            mode: 'light',
            light: { primary: { main: 'red' } },
            dark: { primary: { main: 'blue' } },
          } as any
        }
      >
        <App />
      </ThemeProvider>
    );
    const res = await screen.findByTestId('app');
    expect(res?._fiber?.stateNode?.props.children).toBe('red');
    rerender(
      <ThemeProvider
        theme={
          {
            mode: 'dark',
            light: { primary: { main: 'red' } },
            dark: { primary: { main: 'blue' } },
          } as any
        }
      >
        <App />
      </ThemeProvider>
    );
    const res2 = await screen.findByTestId('app');
    expect(res2?._fiber?.stateNode?.props.children).toBe('blue');
  });

  test('withDynamicColor', () => {
    const dynamicColor = withDynamicColor(exampleTheme);
    expect(dynamicColor('primary.main')).toBe('#012');
    dynamicColor.merge({ mode: 'dark' });
    expect(dynamicColor('primary.main')).toBe('#fde');
  })

  test('StyleSheet polyfill', async () => {
    const styles = StyleSheet.flatten({
      color: DynamicColorIOSProperty(exampleTuple),
    });
    expect(styles.color).toStrictEqual(DynamicColorIOS(exampleTuple));

    const Component = styled.View`
      color: ${DynamicColorIOSProperty(exampleTuple)};
    `;
    render(<Component testID="foo" />);
    const res = await screen.findByTestId('foo');
    expect(res?._fiber?.stateNode?.props?.style?.[0]?.color).toStrictEqual(
      DynamicColorIOS(exampleTuple)
    );
  });
});
