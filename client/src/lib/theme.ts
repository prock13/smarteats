import { createTheme, responsiveFontSizes } from "@mui/material";

// Create a base theme with proper configuration
let theme = createTheme({
  components: {
    MuiPopover: {
      defaultProps: {
        container: () => document.getElementById('root') || document.body,
      },
    },
    MuiPopper: {
      defaultProps: {
        container: () => document.getElementById('root') || document.body,
      },
    },
    MuiModal: {
      defaultProps: {
        container: () => document.getElementById('root') || document.body,
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '0.5rem',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '1rem',
          paddingRight: '1rem',
        },
      },
    },
  },
  typography: {
    fontFamily: 'inherit',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#3b82f6', // Tailwind blue-500
      light: '#60a5fa', // Tailwind blue-400
      dark: '#2563eb', // Tailwind blue-600
    },
    secondary: {
      main: '#10b981', // Tailwind emerald-500
      light: '#34d399', // Tailwind emerald-400
      dark: '#059669', // Tailwind emerald-600
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937', // Tailwind gray-800
      secondary: '#4b5563', // Tailwind gray-600
    },
  },
});

// Make the theme responsive
theme = responsiveFontSizes(theme);

export default theme;
