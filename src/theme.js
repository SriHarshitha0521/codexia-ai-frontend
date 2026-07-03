import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#6C63FF"
    },
    secondary: {
      main: "#00E5FF"
    },
    background: {
      default: "#0f172a",
      paper: "#1e293b"
    }
  },
  typography: {
    fontFamily: "Inter, sans-serif"
  }
});

export default theme;