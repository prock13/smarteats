import { useState } from "react";
import { useLocation } from "wouter";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from "@mui/material";
import {
  Restaurant,
  CalendarMonth,
  Favorite,
  BarChart,
  LocalDining,
  Tune,
  Check,
  Chat as ChatIcon,
  Kitchen as KitchenIcon,
} from "@mui/icons-material";

const features = [
  {
    title: "Macro Meal Planner",
    description:
      "Plan your meals with AI-powered suggestions based on your macronutrient goals.",
    icon: <Restaurant sx={{ fontSize: 40 }} />,
    route: "/planner",
    details: [
      "Get personalized meal suggestions based on your remaining macros",
      "AI-powered recipe generation tailored to your dietary preferences",
      "Easy-to-follow recipes with detailed instructions",
      "Quick macro calculation and portion adjustments",
    ],
  },
  {
    title: "Pantry Manager",
    description:
      "Keep track of your ingredients and get recipe suggestions based on what you have.",
    icon: <KitchenIcon sx={{ fontSize: 40 }} />,
    route: "/pantry",
    details: [
      "Track available ingredients",
      "Get recipe suggestions based on your pantry",
      "Smart shopping list generation",
      "Ingredient expiration tracking",
    ],
  },
  {
    title: "Chef Nina - AI Assistant",
    description:
      "Meet Nina, your personal AI chef assistant who helps you plan meals and discover new recipes.",
    icon: <ChatIcon sx={{ fontSize: 40 }} />,
    isNina: true,
    details: [
      "Get personalized meal suggestions based on your preferences",
      "Real-time nutritional guidance and recipe modifications",
      "Interactive meal planning assistance",
      "24/7 availability for all your culinary questions",
    ],
  },
  {
    title: "Calendar View",
    description:
      "Organize your meals throughout the week with an intuitive calendar interface.",
    icon: <CalendarMonth sx={{ fontSize: 40 }} />,
    route: "/calendar",
    details: [
      "Weekly and monthly meal planning views",
      "Drag and drop meal organization",
      "Quick meal rotation and scheduling",
      "Meal prep planning assistance",
    ],
  },
  {
    title: "Recipe Collection",
    description: "Organize all your favorite recipes for quick access.",
    icon: <Favorite sx={{ fontSize: 40 }} />,
    route: "/recipes",
    details: [
      "Save your favorite recipes for use in the Meal Finder.",
      "Filter by dietary preferences and restrictions",
      "Save and organize your favorite meals",
      "Share recipes with friends and family",
    ],
  },
  {
    title: "Macro Tracking",
    description: "Track your daily macro intake with detailed analytics and insights.",
    icon: <BarChart sx={{ fontSize: 40 }} />,
    route: "/",
    comingSoon: true,
    details: [
      "Real-time macro nutrient tracking",
      "Customizable daily and weekly goals",
      "Detailed nutrition analytics and trends",
      "Progress visualization and reports",
    ],
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedFeature, setSelectedFeature] = useState<(typeof features)[0] | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleLearnMore = (feature: (typeof features)[0]) => {
    setSelectedFeature(feature);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedFeature(null);
  };

  const handleNavigate = () => {
    if (selectedFeature) {
      if (selectedFeature.isNina) {
        // Trigger the chat modal from navigation
        const chatBtn = document.querySelector('[data-chat-trigger="true"]') as HTMLElement;
        if (chatBtn) {
          chatBtn.click();
        }
        setOpenDialog(false);
        return;
      }
      if (!selectedFeature.comingSoon && selectedFeature.route) {
        setOpenDialog(false);
        setLocation(selectedFeature.route);
      }
    }
  };

  return (
    <Box sx={{ flexGrow: 1, py: 8 }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              mb: 2,
              background: "linear-gradient(45deg, #2E7D32 30%, #1565C0 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: "bold",
            }}
          >
            Smart Meal Planning
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
            Your personal AI-powered nutrition assistant
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => setLocation("/planner")}
            startIcon={<Restaurant />}
            sx={{
              py: 1.5,
              px: 4,
              background: "linear-gradient(45deg, #2E7D32 30%, #1565C0 90%)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(45deg, #1B5E20 30%, #0D47A1 90%)",
              },
            }}
          >
            Start Planning
          </Button>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                  <Box sx={{ mb: 2, color: "primary.main" }}>
                    {feature.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="h2">
                    {feature.title}
                  </Typography>
                  {feature.comingSoon && (
                    <Chip
                      label="Coming Soon"
                      color="primary"
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                  <Button
                    size="small"
                    onClick={() => handleLearnMore(feature)}
                    sx={{ textTransform: "none" }}
                  >
                    Learn More
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Feature Details Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          aria-labelledby="feature-dialog-title"
          aria-describedby="feature-dialog-description"
        >
          {selectedFeature && (
            <>
              <DialogTitle
                id="feature-dialog-title"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  background: "linear-gradient(45deg, #2E7D32 30%, #1565C0 90%)",
                  color: "white",
                }}
              >
                {selectedFeature.icon}
                {selectedFeature.title}
                {selectedFeature.comingSoon && (
                  <Chip
                    label="Coming Soon"
                    color="primary"
                    size="small"
                    sx={{ ml: "auto", bgcolor: "white" }}
                  />
                )}
              </DialogTitle>
              <DialogContent id="feature-dialog-description">
                <Typography variant="body1" paragraph>
                  {selectedFeature.description}
                </Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Key Features:
                </Typography>
                <List>
                  {selectedFeature.details.map((detail, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Check sx={{ color: "primary.main" }} />
                      </ListItemIcon>
                      <ListItemText primary={detail} />
                    </ListItem>
                  ))}
                </List>
              </DialogContent>
              <DialogActions sx={{ p: 3 }}>
                <Button onClick={handleCloseDialog}>Close</Button>
                {!selectedFeature.comingSoon && (selectedFeature.route || selectedFeature.isNina) && (
                  <Button
                    variant="contained"
                    onClick={handleNavigate}
                    sx={{
                      background: "linear-gradient(45deg, #2E7D32 30%, #1565C0 90%)",
                      color: "white",
                      "&:hover": {
                        background: "linear-gradient(45deg, #1B5E20 30%, #0D47A1 90%)",
                      },
                    }}
                  >
                    {selectedFeature.isNina ? "Chat with Nina" : "Try Now"}
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </Box>
  );
}