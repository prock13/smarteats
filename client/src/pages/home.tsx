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
} from "@mui/material";
import {
  Restaurant,
  CalendarMonth,
  Favorite,
  BarChart,
  LocalDining,
  Tune,
  Check,
} from "@mui/icons-material";
import { useState } from "react";

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
  } /*
  {
    title: "Macro Tracking",
    description:
      "Keep track of your daily macronutrient intake with visual progress indicators.",
    icon: <BarChart sx={{ fontSize: 40 }} />,
    route: "/planner",
    details: [
      "Real-time macro tracking and visualization",
      "Daily, weekly, and monthly progress reports",
      "Custom macro goal setting",
      "Nutritional insights and recommendations",
    ],
  },
  {
    title: "Dietary Preferences",
    description:
      "Customize meal suggestions based on your dietary restrictions and preferences.",
    icon: <LocalDining sx={{ fontSize: 40 }} />,
    route: "/planner",
    details: [
      "Support for various dietary restrictions",
      "Allergen filtering and alerts",
      "Customizable ingredient preferences",
      "Smart substitution recommendations",
    ],
  },
  {
    title: "Smart Recommendations",
    description:
      "Get personalized meal recommendations powered by advanced AI algorithms.",
    icon: <Tune sx={{ fontSize: 40 }} />,
    route: "/planner",
    details: [
      "AI-powered meal suggestions",
      "Learning from your preferences over time",
      "Seasonal recipe recommendations",
      "Nutrition optimization suggestions",
    ],
  },*/,
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedFeature, setSelectedFeature] = useState<
    (typeof features)[0] | null
  >(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleLearnMore = (feature: (typeof features)[0]) => {
    setSelectedFeature(feature);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleNavigate = () => {
    if (selectedFeature) {
      setOpenDialog(false);
      setLocation(selectedFeature.route);
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
        >
          {selectedFeature && (
            <>
              <DialogTitle
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  background:
                    "linear-gradient(45deg, #2E7D32 30%, #1565C0 90%)",
                  color: "white",
                }}
              >
                {selectedFeature.icon}
                {selectedFeature.title}
              </DialogTitle>
              <DialogContent sx={{ mt: 2 }}>
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
                  Try Now
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </Box>
  );
}
