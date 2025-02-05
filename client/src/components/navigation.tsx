import { Link } from "wouter";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Menu as MenuIcon,
  CalendarMonth,
  Kitchen,
  Calculate,
  Favorite,
  Restaurant,
  Person,
} from "@mui/icons-material";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function Navigation() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { logoutMutation } = useAuth();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link href="/">SmartEats</Link>
        </Typography>
        <Button color="inherit" onClick={() => logoutMutation.mutate()}>
          Logout
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          onClick={handleClose}
        >
          <MenuItem component={Link} href="/calendar">
            <ListItemIcon>
              <CalendarMonth />
            </ListItemIcon>
            <ListItemText>Calendar</ListItemText>
          </MenuItem>
          <MenuItem component={Link} href="/planner">
            <ListItemIcon>
              <Calculate />
            </ListItemIcon>
            <ListItemText>Macro Match</ListItemText>
          </MenuItem>
          <MenuItem component={Link} href="/recipes">
            <ListItemIcon>
              <Restaurant />
            </ListItemIcon>
            <ListItemText>Recipes</ListItemText>
          </MenuItem>
          <MenuItem component={Link} href="/favorites">
            <ListItemIcon>
              <Favorite />
            </ListItemIcon>
            <ListItemText>Favorites</ListItemText>
          </MenuItem>
          <MenuItem component={Link} href="/pantry">
            <ListItemIcon>
              <Kitchen />
            </ListItemIcon>
            <ListItemText>Pantry Pal</ListItemText>
          </MenuItem>
          <MenuItem component={Link} href="/profile">
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}