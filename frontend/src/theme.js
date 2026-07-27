import { createTheme } from '@mui/material/styles'

// A quiet, deliberate palette: deep slate for structure, a single warm
// signal color reserved for the storage meter and primary actions only.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3457D5', // cobalt — used sparingly for primary actions
      dark: '#243C99',
      light: '#6D82E0',
    },
    secondary: {
      main: '#E0762C', // warm amber, reserved for the storage usage indicator
    },
    background: {
      default: '#F5F6F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1B1F2A',
      secondary: '#5B6270',
    },
    divider: '#E4E7EC',
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
})

export default theme
