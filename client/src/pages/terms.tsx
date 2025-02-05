import { Container, Typography, Box, List, ListItem } from "@mui/material";

export default function TermsOfService() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{
        background: 'linear-gradient(45deg, #2E7D32 30%, #1565C0 90%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        mb: 4
      }}>
        Terms of Service
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>1. Terms</Typography>
        <Typography paragraph>
          By accessing Smart Meal Planner, you agree to be bound by these terms of service and agree that you are responsible for compliance with any applicable local laws.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>2. Use License</Typography>
        <Typography paragraph>
          Permission is granted to temporarily use Smart Meal Planner for personal, non-commercial transitory viewing only.
        </Typography>
        <List sx={{ pl: 4 }}>
          <ListItem sx={{ display: 'list-item' }}>
            Modify or copy the materials
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            Use the materials for any commercial purpose
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            Transfer the materials to another person or mirror the materials on any other server
          </ListItem>
        </List>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>3. Disclaimer</Typography>
        <Typography paragraph>
          The materials on Smart Meal Planner are provided on an 'as is' basis. Smart Meal Planner makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>4. Nutritional Information</Typography>
        <Typography paragraph>
          While we strive to provide accurate nutritional information and meal recommendations, users should be aware that:
        </Typography>
        <List sx={{ pl: 4 }}>
          <ListItem sx={{ display: 'list-item' }}>
            Nutritional values are estimates and may vary
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            Users should consult with healthcare professionals regarding their specific dietary needs
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            We are not responsible for any health issues that may arise from following meal plans
          </ListItem>
        </List>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>5. AI-Generated Content</Typography>
        <Typography paragraph>
          Our service uses AI to generate meal suggestions and recipes. Users acknowledge that:
        </Typography>
        <List sx={{ pl: 4 }}>
          <ListItem sx={{ display: 'list-item' }}>
            AI-generated content may not always be perfect or complete
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            Users should use their judgment when following AI-generated recipes
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            We are not liable for any issues arising from AI-generated content
          </ListItem>
        </List>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>6. Privacy</Typography>
        <Typography paragraph>
          Your use of Smart Meal Planner is subject to our Privacy Policy. We collect and use information as described in our Privacy Policy.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>7. Limitations</Typography>
        <Typography paragraph>
          In no event shall Smart Meal Planner or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Smart Meal Planner.
        </Typography>
      </Box>

      <Box>
        <Typography variant="h5" gutterBottom>8. Governing Law</Typography>
        <Typography paragraph>
          These terms and conditions are governed by and construed in accordance with the laws and any dispute shall be subject to the exclusive jurisdiction of the courts.
        </Typography>
      </Box>
    </Container>
  );
}
