import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider as CustomThemeProvider } from "@/hooks/use-theme";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { ProtectedRoute } from "@/lib/protected-route";
import { useTheme } from "@/hooks/use-theme";
import { TutorialProvider } from "@/components/tutorial/TutorialProvider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Calendar from "@/pages/calendar";
import Recipes from "@/pages/recipes";
import Favorites from "@/pages/favorites";
import Planner from "@/pages/planner";
import Auth from "@/pages/auth";
import Profile from "@/pages/profile";
import Navigation from "@/components/navigation";
import { Box, Container, Snackbar, Alert } from "@mui/material";

function ThemedApp() {
  const { theme } = useTheme();

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Navigation />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Switch>
            <Route path="/auth" component={Auth} />
            <ProtectedRoute path="/" component={Home} />
            <ProtectedRoute path="/planner" component={Planner} />
            <ProtectedRoute path="/calendar" component={Calendar} />
            <ProtectedRoute path="/recipes" component={Recipes} />
            <ProtectedRoute path="/favorites" component={Favorites} />
            <ProtectedRoute path="/profile" component={Profile} />
            <Route component={NotFound} />
          </Switch>
        </Container>
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
          <TutorialProvider>
            <ThemedApp />
          </TutorialProvider>
        </CustomThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;