import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { StyledEngineProvider, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider as CustomThemeProvider } from "@/hooks/use-theme";
import { CssBaseline } from "@mui/material";
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
import Preferences from "@/pages/preferences";
import Pantry from "@/pages/pantry";
import Terms from "@/pages/terms";
import About from "@/pages/about";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/Footer";
import { Box, Container } from "@mui/material";
import { useLocation } from "wouter";
import MyFitnessPal from "@/pages/myfitnesspal";
import CameraPage from "./pages/camera"; // Added import for CameraPage


// Removed unused theme variable
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
        <Container maxWidth="lg" sx={{ py: { xs: 1, md: 4 }, flex: 1 }}>
          <Switch>
            <Route path="/auth" component={Auth} />
            <Route path="/" component={Home} />
            <Route path="/terms" component={Terms} />
            <Route path="/about" component={About} />
            <Route path="/camera" component={CameraPage} />
            <Route path="/planner">
              <ProtectedRoute path="/planner" component={Planner} />
            </Route>
            <Route path="/calendar">
              <ProtectedRoute path="/calendar" component={Calendar} />
            </Route>
            <Route path="/recipes">
              <ProtectedRoute path="/recipes" component={Recipes} />
            </Route>
            <Route path="/favorites">
              <ProtectedRoute path="/favorites" component={Favorites} />
            </Route>
            <Route path="/profile">
              <ProtectedRoute path="/profile" component={Profile} />
            </Route>
            <Route path="/preferences">
              <ProtectedRoute path="/preferences" component={Preferences} />
            </Route>
            <Route path="/pantry">
              <ProtectedRoute path="/pantry" component={Pantry} />
            </Route>
            <Route path="/myfitnesspal">
              <ProtectedRoute path="/myfitnesspal" component={MyFitnessPal} />
            </Route>
            <Route component={NotFound} />
          </Switch>
        </Container>
        {!isAuthPage && <Footer />}
      </Box>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CustomThemeProvider>
          <StyledEngineProvider injectFirst>
            <ThemedApp />
          </StyledEngineProvider>
        </CustomThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;