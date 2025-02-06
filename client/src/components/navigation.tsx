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
  Avatar,
  Divider,
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
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { Logo } from "./logo";
import { ChatBot } from "./chat-bot";

export default function Navigation() {
  const { user, logoutMutation } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [location, setLocation] = useLocation();
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
        "& .MuiDrawer-paper": { 
          width: 280,
          bgcolor: "background.paper",
        },
      }}
    >
      <Box 
        sx={{ 
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64,
            mb: 1
          }}
        >
          {user.name?.[0]?.toUpperCase() || <AccountCircle />}
        </Avatar>
        <Typography variant="h6">{user.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {user.email}
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <List>
        {navigationItems.map((item) => {
          const isActive = location === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                selected={isActive}
                sx={{
                  py: 1.5,
                  color: "text.primary",
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "inherit",
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: "inherit" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: "0.95rem",
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}

        <Divider sx={{ my: 2 }} />

        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigate("/profile")}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              <AccountCircle />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigate("/settings")}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            onClick={() => logoutMutation.mutate()}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              <AccountCircle />
            </ListItemIcon>
            <ListItemText 
              primary={logoutMutation.isPending ? "Logging out..." : "Logout"}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );

  return (
    <>
      <AppBar 
        position="static" 
        color="primary" 
        elevation={1}
        sx={{
          height: { xs: 56, md: 64 },
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            sx={{
              minHeight: { xs: 56, md: 64 },
              px: { xs: 1, sm: 2 },
            }}
          >
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1, display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.5, sm: 1 },
                flexGrow: 1,
                cursor: "pointer",
              }}
              onClick={() => setLocation("/")}
            >
              <Logo sx={{ fontSize: { xs: 40, md: 50 }, color: "inherit" }} />
              <Typography 
                variant="h5" 
                component="div" 
                sx={{ 
                  fontWeight: "bold",
                  fontSize: { xs: "1.25rem", md: "1.5rem" },
                  display: { xs: "none", sm: "block" }
                }}
              >
                SmartEats
              </Typography>
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
                  sx={{
                    opacity: location === item.path ? 1 : 0.8,
                    fontWeight: location === item.path ? 600 : 400,
                  }}
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
                <MenuItem onClick={() => handleNavigate("/settings")}>
                  Settings
                </MenuItem>
                <MenuItem onClick={() => logoutMutation.mutate()}>
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </MenuItem>
              </Menu>
            </Box>

            {/* Mobile-only icons */}
            <Box 
              sx={{ 
                display: { xs: "flex", md: "none" }, 
                gap: 0.5,
                "& .MuiIconButton-root": {
                  padding: 1,
                }
              }}
            >
              <IconButton color="inherit" onClick={() => setChatOpen(true)}>
                <ChatIcon />
              </IconButton>
              <IconButton onClick={handleMenu} color="inherit">
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