import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider as CustomThemeProvider } from "@/hooks/use-theme";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { ProtectedRoute } from "@/lib/protected-route";
import { useTheme } from "@/hooks/use-theme";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Calendar from "@/pages/calendar";
import Recipes from "@/pages/recipes";
import Favorites from "@/pages/favorites";
import Planner from "@/pages/planner";
import Auth from "@/pages/auth";
import Profile from "@/pages/profile";
import Pantry from "@/pages/pantry";
import Terms from "@/pages/terms";
import About from "@/pages/about"; // Added import for About component
import Navigation from "@/components/navigation";
import { Footer } from "@/components/Footer";
import { Box, Container, Snackbar, Alert } from "@mui/material";
import { useLocation } from "wouter";

function ThemedApp() {
  const { theme } = useTheme();
  const [location] = useLocation();
  const isAuthPage = location === "/auth";

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: isAuthPage ? 'grey.100' : 'background.default',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {!isAuthPage && <Navigation />}
        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          <Switch>
            <Route path="/auth" component={Auth} />
            <Route path="/terms" component={Terms} />
            <Route path="/about" component={About} /> {/* Added Route for About */}
            <ProtectedRoute path="/" component={Home} />
            <ProtectedRoute path="/planner" component={Planner} />
            <ProtectedRoute path="/calendar" component={Calendar} />
            <ProtectedRoute path="/recipes" component={Recipes} />
            <ProtectedRoute path="/favorites" component={Favorites} />
            <ProtectedRoute path="/profile" component={Profile} />
            <ProtectedRoute path="/pantry" component={Pantry} />
            <Route component={NotFound} />
          </Switch>
        </Container>
        {!isAuthPage && <Footer />}
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          autoHideDuration={6000}
        >
          <Alert severity="info" variant="filled">
            Message
          </Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CustomThemeProvider>
          <ThemedApp />
        </CustomThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;