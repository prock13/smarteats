import { Box, Container, Typography, Paper } from "@mui/material";

export default function MyFitnessPalPage() {
  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="lg">
        <Paper
          elevation={2}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
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
            MyFitnessPal Integration
          </Typography>
          <Typography variant="h5" align="center" color="text.secondary">
            Coming Soon
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ maxWidth: 600 }}>
            We're working on integrating MyFitnessPal to provide you with even better nutrition tracking capabilities. Stay tuned!
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
