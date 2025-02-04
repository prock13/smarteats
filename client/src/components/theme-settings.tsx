import { useTheme } from "@/hooks/use-theme";
import {
  Card,
  CardContent,
  CardHeader,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Typography,
  Slider,
  Box,
} from "@mui/material";

export function ThemeSettings() {
  const { settings, updateTheme } = useTheme();

  return (
    <Card>
      <CardHeader title="Theme Settings" />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Appearance</InputLabel>
            <Select
              value={settings.mode}
              label="Appearance"
              onChange={(e) => updateTheme({ mode: e.target.value as 'light' | 'dark' | 'system' })}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="system">System</MenuItem>
            </Select>
          </FormControl>

          <Box>
            <Typography gutterBottom>Primary Color</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                type="color"
                value={settings.primary}
                onChange={(e) => updateTheme({ primary: e.target.value })}
                sx={{ width: 100 }}
              />
              <TextField
                fullWidth
                value={settings.primary}
                onChange={(e) => updateTheme({ primary: e.target.value })}
                placeholder="#000000"
              />
            </Box>
          </Box>

          <Box>
            <Typography gutterBottom>Border Radius</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Slider
                value={settings.borderRadius}
                onChange={(_, value) => updateTheme({ borderRadius: value as number })}
                min={0}
                max={16}
                step={1}
                valueLabelDisplay="auto"
                sx={{ flex: 1 }}
              />
              <Typography sx={{ minWidth: 50 }} align="right">
                {settings.borderRadius}px
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}