import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Calendar from "@/pages/calendar";
import Recipes from "@/pages/recipes";
import Favorites from "@/pages/favorites";
import Planner from "@/pages/planner";
import Auth from "@/pages/auth";
import { useAuth } from "@/hooks/use-auth";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Container,
  useTheme
} from '@mui/material';
import {
  CalendarMonth,
  Restaurant,
  Favorite,
  AccountCircle
} from '@mui/icons-material';
import { useState } from 'react';
import { useLocation } from 'wouter';
import Profile from "@/pages/profile";

function Navigation() {
  const { user, logoutMutation } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [, setLocation] = useLocation();
  const theme = useTheme();

  if (!user) return null;

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    setLocation(path);
    handleClose();
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => setLocation('/')}
          >
            Meal Planner
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              color="inherit"
              startIcon={<CalendarMonth />}
              onClick={() => setLocation('/calendar')}
            >
              Calendar
            </Button>
            <Button
              color="inherit"
              startIcon={<Restaurant />}
              onClick={() => setLocation('/recipes')}
            >
              Recipes
            </Button>
            <Button
              color="inherit"
              startIcon={<Favorite />}
              onClick={() => setLocation('/favorites')}
            >
              Favorites
            </Button>

            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => handleNavigate('/profile')}>Profile</MenuItem>
              <MenuItem onClick={() => logoutMutation.mutate()}>
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

function Router() {
  return (
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
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Navigation />
            <Container maxWidth="lg" sx={{ py: 4 }}>
              <Router />
            </Container>
          </Box>
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;