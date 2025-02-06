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
  IconButton,
} from "@mui/material";
import {
  Restaurant,
  CalendarMonth,
  Favorite,
  BarChart,
  Check,
  Chat as ChatIcon,
  Kitchen as KitchenIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { ChatBot } from "@/components/chat-bot";

const features = [
  {
    title: "Macro Match",
    description:
      "Get personalized meal suggestions based on your remaining macros for the day.",
    icon: <Restaurant sx={{ fontSize: 40 }} />,
    route: "/planner",
    details: [
      "Plan your meals with AI-powered suggestions based on your macronutrient goals",
      "AI-powered recipe generation tailored to your dietary preferences",
      "Easy-to-follow recipes with detailed instructions and nutrients",
      "Quick macro calculation and portion adjustments (Coming Soon)",
    ],
  },
  {
    title: "Pantry Pal",
    description:
      "Get recipe suggestions based on food items that you have on hand.",
    icon: <KitchenIcon sx={{ fontSize: 40 }} />,
    route: "/pantry",
    details: [
      "Get recipe suggestions based on your available pantry items.",
      "Track available ingredients (Coming Soon)",
      "Smart shopping list generation (Coming Soon)",
      "Ingredient expiration tracking (Coming Soon)",
    ],
  },
  {
    title: "Chef Nina – Your AI Sous Chef",
    description:
      "Say hello to Nina, your AI-powered sous-chef, ready to help you plan meals, find recipes, and whip up delicious dishes with ease!",
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
    title: "Smart Calendar",
    description:
      "Organize your meals throughout the week with an intuitive calendar interface.",
    icon: <CalendarMonth sx={{ fontSize: 40 }} />,
    route: "/calendar",
    details: [
      "Weekly and monthly meal planning views (Coming Soon)",
      "Drag and drop meal organization (Coming Soon)",
      "Quick meal rotation and scheduling (Coming Soon)",
      "Meal prep planning assistance (Coming Soon)",
    ],
  },
  {
    title: "My Recipe Collection",
    description:
      "Save all your personal recipes for quick access and use in Macro Match and Pantry Pal.",
    icon: <Favorite sx={{ fontSize: 40 }} />,
    route: "/recipes",
    details: [
      "Save and organize your favorite meals",
      "Filter by dietary preferences and restrictions (Coming Soon)",
      "Share recipes with friends and family (Coming Soon)",
    ],
  },
  {
    title: "Macro Tracking",
    description:
      "Track your daily macro intake with detailed analytics and insights.",
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
  const [selectedFeature, setSelectedFeature] = useState<
    (typeof features)[0] | null
  >(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

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
        setChatOpen(true);
        setOpenDialog(false);
      } else if (!selectedFeature.comingSoon && selectedFeature.route) {
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
            variant="h3"
            component="h1"
            sx={{
              mb: 2,
              background: "linear-gradient(45deg, #2E7D32 30%, #1565C0 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: "bold",
            }}
          >
            Smarter Eating, Made Simple
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
            AI-driven meal planning tailored just for you.
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
        >
          {selectedFeature && (
            <>
              <DialogTitle
                id="feature-dialog-title"
                sx={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  background:
                    "linear-gradient(45deg, #2E7D32 30%, #1565C0 90%)",
                  color: "white",
                  pr: 6,
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
                <IconButton
                  onClick={handleCloseDialog}
                  sx={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "white",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.1)",
                    },
                    zIndex: 1,
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ mt: 2 }}>
                <Box id="feature-dialog-description">
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
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 3 }}>
                {!selectedFeature.comingSoon &&
                  (selectedFeature.route || selectedFeature.isNina) && (
                    <Button
                      variant="contained"
                      onClick={handleNavigate}
                      sx={{
                        background:
                          "linear-gradient(45deg, #2E7D32 30%, #1565C0 90%)",
                        color: "white",
                        "&:hover": {
                          background:
                            "linear-gradient(45deg, #1B5E20 30%, #0D47A1 90%)",
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

        {/* Chat Bot Component */}
        <ChatBot open={chatOpen} onClose={() => setChatOpen(false)} />
      </Container>
    </Box>
  );
}
