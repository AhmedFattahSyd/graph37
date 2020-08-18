import { createMuiTheme } from "@material-ui/core/styles";
import red from "@material-ui/core/colors/red"
import grey from "@material-ui/core/colors/grey";
import { blue } from "@material-ui/core/colors";

export default createMuiTheme({
  palette: {
    primary: {
      main: blue[600],
      contrastText: "#fff",
      light:blue[100],
      dark: blue[800]
    },
    background: {
      default: grey[200]
    },
    secondary: {
      main: red[900],
      light: red[300],
      contrastText: "#000"
    },
    contrastThreshold: 3
  },
});
