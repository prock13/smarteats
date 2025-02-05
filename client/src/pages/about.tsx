import { Box, Container, Typography, Paper } from "@mui/material";
import { Logo } from "@/components/logo";

export default function AboutPage() {
  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="lg">
        <Paper 
          elevation={2} 
          sx={{ 
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4
          }}
        >
          <Logo sx={{ fontSize: 120 }} />

          <Box sx={{ maxWidth: 800, mx: 'auto', textAlign: 'center' }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{
                background: "linear-gradient(45deg, #4CAF50 30%, #2196F3 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 4,
              }}
            >
              About SmartEats
            </Typography>

            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
              SmartEats is a comprehensive AI-powered meal planning platform that helps users create personalized meal plans based on their nutritional preferences and available ingredients. The application features two innovative recipe discovery systems: Macro Match, which helps you find the perfect meals to fit your remaining macro-nutrient goals for the day, and Pantry Pal, which generates recipe suggestions based on ingredients you have on hand. Each recipe comes with detailed nutritional information, cooking instructions, and macro-nutrient tracking visualized through interactive progress bars.
            </Typography>

            <Typography variant="body1" paragraph>
              The platform includes a robust calendar system for meal planning, allowing users to schedule meals across different time periods with day, week, and month views. Users can upload their own custom recipes through My Recipes, which are then seamlessly integrated into both Pantry Pal and Macro Match suggestions. The app also features a Favorites system where users can save and organize their preferred recipes for quick access, add custom tags, and share recipes across various social media platforms. All of this is presented through an intuitive, easy-to-use interface that's responsive across all devices, making meal planning and nutrition tracking a seamless experience.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}