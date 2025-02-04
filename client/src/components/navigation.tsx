import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Container,
} from "@mui/material";
import {
  CalendarMonth,
  Restaurant,
  Favorite,
  AccountCircle,
} from "@mui/icons-material";
import { Logo } from "./logo";

export default function Navigation() {
  const { user, logoutMutation } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [, setLocation] = useLocation();

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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexGrow: 1,
              cursor: "pointer",
            }}
            onClick={() => setLocation("/")}
          >
            <Logo sx={{ fontSize: 50 }} />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              color="inherit"
              startIcon={<CalendarMonth />}
              onClick={() => setLocation("/calendar")}
            >
              Calendar
            </Button>
            <Button
              color="inherit"
              startIcon={<Restaurant />}
              onClick={() => setLocation("/recipes")}
            >
              My Recipes
            </Button>
            <Button
              color="inherit"
              startIcon={<Favorite />}
              onClick={() => setLocation("/favorites")}
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
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem onClick={() => handleNavigate("/profile")}>
                Profile
              </MenuItem>
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