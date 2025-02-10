import { Box, Container, Typography } from "@mui/material";
import { ThemeSettings } from "@/components/theme-settings";

export default function PreferencesPage() {
  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Preferences
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <ThemeSettings />
        </Box>
      </Container>
    </Box>
  );
}
