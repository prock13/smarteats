import { Box, Container, Typography, Link } from "@mui/material";
import { useLocation } from "wouter";

export function Footer() {
  const [, setLocation] = useLocation();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} Smart Meal Planner. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => setLocation("/terms")}
              sx={{ cursor: 'pointer' }}
            >
              Terms of Service
            </Link>
            <Link
              href="mailto:support@smartmealplanner.com"
              variant="body2"
              sx={{ cursor: 'pointer' }}
            >
              Contact Support
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
