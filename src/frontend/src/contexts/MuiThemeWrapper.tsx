import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { useMemo } from 'react';
import type { JSX } from 'react';

export function MuiThemeWrapper({ children }: Readonly<{ children: JSX.Element }>) {
  const { colorScheme } = useMantineColorScheme();
  const mantineTheme = useMantineTheme();

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: colorScheme === 'dark' ? 'dark' : 'light',
          background: {
            default: colorScheme === 'dark' ? mantineTheme.colors.dark[7] : mantineTheme.colors.gray[0],
            paper: colorScheme === 'dark' ? mantineTheme.colors.dark[7] : mantineTheme.white,
          },
          text: {
            secondary: colorScheme === 'dark' ? mantineTheme.colors.dark[2] : mantineTheme.colors.gray[7],
          },
          divider: colorScheme === 'dark' ? mantineTheme.colors.dark[5] : mantineTheme.colors.gray[2],
        },
        components: {
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: colorScheme === 'dark' ? mantineTheme.colors.dark[7] : mantineTheme.colors.gray[0],
                borderRight: `1px solid ${colorScheme === 'dark' ? mantineTheme.colors.dark[5] : mantineTheme.colors.gray[2]}`,
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                '&:hover': {
                  backgroundColor: colorScheme === 'dark' ? mantineTheme.colors.dark[6] : mantineTheme.colors.gray[1],
                },
              },
            },
          },
        },
      }),
    [colorScheme, mantineTheme]
  );

  return <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>;
}

