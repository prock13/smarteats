import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  TextField
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type InsertMealPlan } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function CalendarPage() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedMealType, setSelectedMealType] = useState<string>("breakfast");

  const startOfMonth = new Date(date?.getFullYear() || 2024, date?.getMonth() || 0, 1);
  const endOfMonth = new Date(date?.getFullYear() || 2024, (date?.getMonth() || 0) + 1, 0);

  const { data: mealPlans, isLoading } = useQuery({
    queryKey: ["/api/meal-plans", startOfMonth.toISOString(), endOfMonth.toISOString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/meal-plans?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch meal plans");
      return res.json();
    },
  });

  const addMealPlan = useMutation({
    mutationFn: async (plan: InsertMealPlan) => {
      const res = await apiRequest("POST", "/api/meal-plans", plan);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast("Meal plan added successfully", { severity: "success" });
    },
    onError: (error) => {
      toast(error.message, { severity: "error" });
    },
  });

  const deleteMealPlan = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/meal-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast("Meal plan deleted successfully", { severity: "success" });
    },
    onError: (error) => {
      toast(error.message, { severity: "error" });
    },
  });

  const mealsByDate = mealPlans?.reduce((acc: Record<string, any[]>, plan: any) => {
    const dateStr = format(new Date(plan.date), "yyyy-MM-dd");
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(plan);
    return acc;
  }, {});

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" 
          sx={{ 
            background: 'linear-gradient(45deg, #4CAF50 30%, #2196F3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}>
          Meal Planning Calendar
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Plan your meals and track your nutrition goals
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Calendar</Typography>
            <TextField
              type="date"
              value={date ? format(date, "yyyy-MM-dd") : ""}
              onChange={(e) => setDate(new Date(e.target.value))}
              fullWidth
              sx={{ mb: 2 }}
            />
            {date && (
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Meal Type</InputLabel>
                  <Select
                    value={selectedMealType}
                    onChange={(e) => setSelectedMealType(e.target.value)}
                    label="Meal Type"
                  >
                    <MenuItem value="breakfast">Breakfast</MenuItem>
                    <MenuItem value="lunch">Lunch</MenuItem>
                    <MenuItem value="dinner">Dinner</MenuItem>
                    <MenuItem value="snack">Snack</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {date ? format(date, "MMMM d, yyyy") : "Select a date"}
            </Typography>

            {isLoading ? (
              <Typography>Loading...</Typography>
            ) : date ? (
              <Box sx={{ mt: 2 }}>
                {mealsByDate?.[format(date, "yyyy-MM-dd")]?.map((plan: any) => (
                  <Card key={plan.id} sx={{ mb: 2, bgcolor: 'background.paper' }}>
                    <CardHeader
                      title={plan.mealType.charAt(0).toUpperCase() + plan.mealType.slice(1)}
                      action={
                        <IconButton 
                          onClick={() => deleteMealPlan.mutate(plan.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    />
                    <CardContent>
                      <Typography variant="h6">{plan.meal.name}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 1 }}>
                        {plan.meal.description}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Macros: {plan.meal.macros.carbs}g carbs, {plan.meal.macros.protein}g protein, {plan.meal.macros.fats}g fats
                      </Typography>
                    </CardContent>
                  </Card>
                )) || (
                  <Typography color="text.secondary">
                    No meals planned for this date
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography color="text.secondary">
                Select a date to view or plan meals
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}