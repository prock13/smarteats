import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, startOfDay, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  IconButton,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import TodayIcon from '@mui/icons-material/Today';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RecipeCard } from "@/components/ui/RecipeCard";

type ViewType = 'day' | 'week' | 'month';

export default function CalendarPage() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [viewType, setViewType] = useState<ViewType>('day');
  const [selectedMealTypes, setSelectedMealTypes] = useState<Set<string>>(
    new Set(["breakfast", "lunch", "dinner", "snack"])
  );
  const [expandedCards, setExpandedCards] = useState<{[key: number]: boolean}>({});

  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

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

  const deleteMealPlan = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/meal-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({
        title: "Success",
        description: "Meal plan deleted successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = `${e.target.value}T12:00:00`;
    const selectedDate = new Date(dateString);
    setDate(startOfDay(selectedDate));
  };

  const handleMealTypeToggle = (mealType: string) => {
    setSelectedMealTypes((prev) => {
      const newTypes = new Set(prev);
      if (newTypes.has(mealType)) {
        if (newTypes.size > 1) {
          newTypes.delete(mealType);
        }
      } else {
        newTypes.add(mealType);
      }
      return newTypes;
    });
  };

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: ViewType | null,
  ) => {
    if (newView) {
      setViewType(newView);
    }
  };

  const handleExpandClick = (planId: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [planId]: !prev[planId]
    }));
  };

  const mealTypeOptions = [
    { label: "Breakfast", value: "breakfast" },
    { label: "Lunch", value: "lunch" },
    { label: "Dinner", value: "dinner" },
    { label: "Snack", value: "snack" },
  ];

  const getDisplayDates = () => {
    switch (viewType) {
      case 'week':
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: weekStart, end: weekEnd });
      case 'day':
        return [date];
      case 'month':
        return eachDayOfInterval({ start: startOfMonth, end: endOfMonth });
    }
  };

  const mealsByDate = mealPlans?.reduce((acc: Record<string, any[]>, plan: any) => {
    const dateStr = format(new Date(plan.date), "yyyy-MM-dd");
    if (!acc[dateStr]) acc[dateStr] = [];
    if (selectedMealTypes.has(plan.mealType)) {
      acc[dateStr].push(plan);
    }
    return acc;
  }, {});

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              background: "linear-gradient(45deg, #4CAF50 30%, #2196F3 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1,
            }}
          >
            Meal Planning Calendar
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Plan your meals and track your nutrition goals
          </Typography>
        </Box>

        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                type="date"
                label="Select Date"
                value={format(date, "yyyy-MM-dd")}
                onChange={handleDateChange}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <ToggleButtonGroup
                value={viewType}
                exclusive
                onChange={handleViewChange}
                aria-label="view type"
                fullWidth
              >
                <ToggleButton value="day" aria-label="day view">
                  <TodayIcon sx={{ mr: 1 }} /> Day
                </ToggleButton>
                <ToggleButton value="week" aria-label="week view">
                  <ViewWeekIcon sx={{ mr: 1 }} /> Week
                </ToggleButton>
                <ToggleButton value="month" aria-label="month view">
                  <CalendarMonthIcon sx={{ mr: 1 }} /> Month
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Filter Meal Types
              </Typography>
              <FormGroup row>
                {mealTypeOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={selectedMealTypes.has(option.value)}
                        onChange={() => handleMealTypeToggle(option.value)}
                        disabled={selectedMealTypes.size === 1 && selectedMealTypes.has(option.value)}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </FormGroup>
            </Grid>
          </Grid>
        </Paper>

        {isLoading ? (
          <Typography align="center">Loading...</Typography>
        ) : (
          getDisplayDates().map((displayDate) => {
            const dateStr = format(displayDate, "yyyy-MM-dd");
            const mealsForDate = mealsByDate?.[dateStr] || [];

            return mealsForDate.length > 0 ? (
              <Box key={dateStr} sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  {format(displayDate, "EEEE, MMMM d, yyyy")}
                </Typography>
                <Grid container spacing={3}>
                  {mealsForDate.map((plan: any) => (
                    <Grid item xs={12} md={6} lg={4} key={plan.id}>
                      <RecipeCard
                        meal={{
                          name: plan.meal.name,
                          description: plan.meal.description,
                          instructions: plan.meal.instructions || "",
                          macros: plan.meal.macros,
                          isStoredRecipe: true,
                          cookingTime: plan.meal.cookingTime,
                          nutrients: plan.meal.nutrients,
                          dietaryRestriction: plan.meal.dietaryRestriction
                        }}
                        showAddToCalendar={false}
                        showDelete={true}
                        expanded={expandedCards[plan.id] || false}
                        onExpandClick={() => handleExpandClick(plan.id)}
                        onDelete={() => deleteMealPlan.mutate(plan.id)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ) : viewType === 'day' ? (
              <Typography key={dateStr} color="text.secondary" align="center">
                No meals planned for {format(displayDate, "MMMM d, yyyy")}
              </Typography>
            ) : null
          })
        )}
      </Container>
    </Box>
  );
}