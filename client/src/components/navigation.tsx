import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  CalendarMonth,
  Restaurant,
  Favorite,
  AccountCircle,
  Chat as ChatIcon,
  Menu as MenuIcon,
  Kitchen as KitchenIcon,
  MenuBook as MenuBookIcon,
} from "@mui/icons-material";
import { Logo } from "./logo";
import { ChatBot } from "./chat-bot";

export default function Navigation() {
  const { user, logoutMutation } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [, setLocation] = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    setMobileOpen(false);
  };

  const navigationItems = [
    { icon: <MenuBookIcon />, text: "Macro Match", path: "/planner" },
    { icon: <KitchenIcon />, text: "Pantry Pal", path: "/pantry" },
    { icon: <CalendarMonth />, text: "Calendar", path: "/calendar" },
    { icon: <Restaurant />, text: "My Recipes", path: "/recipes" },
    { icon: <Favorite />, text: "Favorites", path: "/favorites" },
  ];

  const mobileDrawer = (
    <Drawer
      variant="temporary"
      anchor="left"
      open={mobileOpen}
      onClose={() => setMobileOpen(false)}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: "block", md: "none" },
        "& .MuiDrawer-paper": { width: 240, bgcolor: "background.paper" },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Logo sx={{ fontSize: 40 }} />
      </Box>
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigate(item.path)}
              sx={{ color: "text.primary" }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );

  return (
    <>
      <AppBar position="static" color="primary" elevation={1}>
        <Container maxWidth="lg">
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 2, display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>

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
              <Logo sx={{ fontSize: 50, color: "inherit" }} />
            </Box>

            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 2,
              }}
            >
              {navigationItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => handleNavigate(item.path)}
                >
                  {item.text}
                </Button>
              ))}

              <IconButton
                color="inherit"
                onClick={() => setChatOpen(true)}
                sx={{ ml: 1 }}
              >
                <ChatIcon />
              </IconButton>

              <IconButton size="large" onClick={handleMenu} color="inherit">
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

            {/* Mobile-only icons */}
            <Box sx={{ display: { xs: "flex", md: "none" }, gap: 1 }}>
              <IconButton color="inherit" onClick={() => setChatOpen(true)}>
                <ChatIcon />
              </IconButton>
              <IconButton size="large" onClick={handleMenu} color="inherit">
                <AccountCircle />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {mobileDrawer}
      <ChatBot open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}