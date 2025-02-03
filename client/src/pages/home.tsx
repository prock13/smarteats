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
  CardMedia,
} from "@mui/material";
import {
  Restaurant,
  CalendarMonth,
  Favorite,
  BarChart,
  LocalDining,
  Tune
} from "@mui/icons-material";

const features = [
  {
    title: "Meal Planning",
    description: "Plan your meals with AI-powered suggestions based on your macronutrient goals.",
    icon: <Restaurant sx={{ fontSize: 40 }} />,
    route: "/planner",
  },
  {
    title: "Calendar View",
    description: "Organize your meals throughout the week with an intuitive calendar interface.",
    icon: <CalendarMonth sx={{ fontSize: 40 }} />,
    route: "/calendar",
  },
  {
    title: "Recipe Collection",
    description: "Browse and save your favorite recipes for quick access.",
    icon: <Favorite sx={{ fontSize: 40 }} />,
    route: "/recipes",
  },
  {
    title: "Macro Tracking",
    description: "Keep track of your daily macronutrient intake with visual progress indicators.",
    icon: <BarChart sx={{ fontSize: 40 }} />,
    route: "/planner",
  },
  {
    title: "Dietary Preferences",
    description: "Customize meal suggestions based on your dietary restrictions and preferences.",
    icon: <LocalDining sx={{ fontSize: 40 }} />,
    route: "/planner",
  },
  {
    title: "Smart Recommendations",
    description: "Get personalized meal recommendations powered by advanced AI algorithms.",
    icon: <Tune sx={{ fontSize: 40 }} />,
    route: "/planner",
  },
];

export default function Home() {
  const [, setLocation] = useLocation();

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
              fontWeight: "bold"
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
              '&:hover': {
                background: "linear-gradient(45deg, #1B5E20 30%, #0D47A1 90%)",
              }
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
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ mb: 2, color: 'primary.main' }}>
                    {feature.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="h2">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button 
                    size="small" 
                    onClick={() => setLocation(feature.route)}
                    sx={{ textTransform: 'none' }}
                  >
                    Learn More
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}