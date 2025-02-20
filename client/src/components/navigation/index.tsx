import { Link } from "wouter";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Box,
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
import { useQuery } from "@tanstack/react-query";
import type { UserProfileForm } from "@/pages/profile";

export default function Navigation() {
  const { user, logoutMutation } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { data: profile } = useQuery<UserProfileForm>({
    queryKey: ["/api/user/profile"],
    enabled: !!user,
  });

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
        {user ? (
          <Button color="inherit" onClick={() => logoutMutation.mutate()}>
            Logout
          </Button>
        ) : (
          <Button color="inherit" onClick={() => window.location.href = '/auth'}>
            Login
          </Button>
        )}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          onClick={handleClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              width: 280,
            },
          }}
        >
          {user && (
            <>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar 
                  src={profile?.profilePicture}
                  alt={user?.username}
                  sx={{ width: 40, height: 40 }}
                >
                  {user?.username?.[0]?.toUpperCase()}
                </Avatar>
                <Typography variant="subtitle1">{user?.username}</Typography>
              </Box>
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
            </>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}