import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Button,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Grid,
  LinearProgress,
  Collapse,
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  Favorite,
  FavoriteBorder,
  Share as ShareIcon,
  ExpandMore as ExpandMoreIcon,
  AccessTime as AccessTimeIcon,
  Restaurant as RestaurantIcon,
} from "@mui/icons-material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Recipe } from "@shared/schema";

interface Macros {
  carbs: number;
  protein: number;
  fats: number;
  calories?: number | null;
  fiber?: number | null;
  sugar?: number | null;
}

interface CookingTime {
  prep: number;
  cook: number;
  total: number;
}

interface Meal {
  name: string;
  description: string;
  instructions: string;
  macros: Macros;
  cookingTime?: CookingTime;
  nutrients?: {
    vitamins?: string[];
    minerals?: string[];
  };
  dietaryRestriction?: string;
  isStoredRecipe?: boolean;
}

interface RecipeCardProps {
  meal: Meal;
  onShare: (event: React.MouseEvent<HTMLElement>, meal: Meal) => void;
  targetMacros?: {
    carbs: number;
    protein: number;
    fats: number;
  };
  favorites?: Recipe[];
  showAddToCalendar?: boolean;
  expanded?: boolean;
  onExpandClick?: () => void;
}

export function RecipeCard({
  meal,
  onShare,
  targetMacros,
  favorites,
  showAddToCalendar = true,
  expanded = false,
  onExpandClick = () => {},
}: RecipeCardProps) {
  const { toast } = useToast();
  const [selectedMealType, setSelectedMealType] = useState<string>("dinner");
  const queryClient = useQueryClient();

  const addToCalendarMutation = useMutation({
    mutationFn: async ({ meal, mealType }: { meal: Meal; mealType: string }) => {
      const today = new Date().toISOString();
      const mealPlan = {
        date: today,
        meal: {
          name: meal.name,
          description: meal.description,
          macros: meal.macros,
        },
        mealType,
      };
      const res = await apiRequest("POST", "/api/meal-plans", mealPlan);
      return res.json();
    },
    onSuccess: () => {
      toast({
        description: "Meal added to today's calendar",
      });
    },
    onError: (error: Error) => {
      toast({
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async (meal: Meal) => {
      const favorite = {
        name: meal.name,
        description: meal.description,
        instructions: meal.instructions,
        carbs: meal.macros.carbs,
        protein: meal.macros.protein,
        fats: meal.macros.fats,
        calories: meal.macros.calories,
        fiber: meal.macros.fiber,
        sugar: meal.macros.sugar,
        cooking_time: meal.cookingTime,
        nutrients: meal.nutrients,
        dietaryRestriction: meal.dietaryRestriction || "none",
      };
      const res = await apiRequest("POST", "/api/favorites", favorite);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        description: "Recipe saved to favorites",
      });
    },
    onError: (error: Error) => {
      toast({
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const mealTypeOptions = [
    { label: "Breakfast", value: "breakfast" },
    { label: "Lunch", value: "lunch" },
    { label: "Dinner", value: "dinner" },
    { label: "Snack", value: "snack" },
  ];

  const handleExpandClick = () => {
    onExpandClick();
  };

  return (
    <Card sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: (theme) => theme.shadows[8]
      },
      ...(meal.isStoredRecipe && {
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? 'rgba(25, 118, 210, 0.02)'
            : 'rgba(25, 118, 210, 0.05)'
      })
    }}>
      <CardHeader
        sx={{
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 1
        }}
        action={
          <Box sx={{
            display: "flex",
            gap: 1.5,
            alignItems: 'center',
            pr: 1
          }}>
            <IconButton
              onClick={(e) => onShare(e, meal)}
              color="primary"
              size="small"
            >
              <ShareIcon />
            </IconButton>
            {showAddToCalendar && (
              <>
                <FormControl sx={{ minWidth: 120 }}>
                  <Select
                    size="small"
                    value={selectedMealType}
                    onChange={(e) => setSelectedMealType(e.target.value)}
                    sx={{
                      backgroundColor: 'background.paper',
                      '& .MuiSelect-select': { py: 1 }
                    }}
                  >
                    {mealTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CalendarIcon />}
                  onClick={() =>
                    addToCalendarMutation.mutate({
                      meal,
                      mealType: selectedMealType,
                    })
                  }
                  disabled={addToCalendarMutation.isPending}
                  sx={{
                    minWidth: 'auto',
                    whiteSpace: 'nowrap',
                    px: 2
                  }}
                >
                  {addToCalendarMutation.isPending
                    ? "Adding..."
                    : "Add to Calendar"}
                </Button>
              </>
            )}
            {!meal.isStoredRecipe && favorites ? (
              <IconButton
                color={
                  favorites?.some((f) => f.name === meal.name)
                    ? "primary"
                    : "default"
                }
                onClick={() => {
                  if (!favorites?.some((f) => f.name === meal.name)) {
                    favoriteMutation.mutate(meal);
                  }
                }}
                disabled={
                  favoriteMutation.isPending ||
                  favorites?.some((f) => f.name === meal.name)
                }
                size="small"
              >
                {favorites?.some((f) => f.name === meal.name) ? (
                  <Favorite />
                ) : (
                  <FavoriteBorder />
                )}
              </IconButton>
            ) : null}
          </Box>
        }
      />
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 1.5,
          mb: 2,
        }}>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 600,
              flexGrow: 1
            }}
          >
            {meal.name}
          </Typography>
        </Box>

        <Typography
          variant="body1"
          paragraph
          sx={{
            color: 'text.secondary',
            lineHeight: 1.6,
            mb: 3
          }}
        >
          {meal.description}
        </Typography>

        {targetMacros && (
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1
                }}
              >
                <span>Carbs</span>
                <span>{meal.macros.carbs}g</span>
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(
                  targetMacros.carbs > 0
                    ? (meal.macros.carbs / targetMacros.carbs) * 100
                    : 0,
                  100
                )}
                sx={{
                  mb: 2.5,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor: 'primary.main',
                    transition: 'transform 0.4s linear'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1
                }}
              >
                <span>Protein</span>
                <span>{meal.macros.protein}g</span>
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(
                  targetMacros.protein > 0
                    ? (meal.macros.protein / targetMacros.protein) * 100
                    : 0,
                  100
                )}
                sx={{
                  mb: 2.5,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor: 'success.main',
                    transition: 'transform 0.4s linear'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1
                }}
              >
                <span>Fats</span>
                <span>{meal.macros.fats}g</span>
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(
                  targetMacros.fats > 0
                    ? (meal.macros.fats / targetMacros.fats) * 100
                    : 0,
                  100
                )}
                sx={{
                  mb: 2.5,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor: 'warning.main',
                    transition: 'transform 0.4s linear'
                  }
                }}
              />
            </Grid>
          </Grid>
        )}

        <Box sx={{ mt: 2 }}>
          <Button
            onClick={handleExpandClick}
            endIcon={<ExpandMoreIcon
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            />}
            sx={{ width: '100%', justifyContent: 'space-between' }}
          >
            {expanded ? 'Show Less' : 'Show More Details'}
          </Button>
        </Box>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            {meal.cookingTime && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon fontSize="small" />
                  Cooking Time
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Prep: {meal.cookingTime.prep}min</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Cook: {meal.cookingTime.cook}min</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Total: {meal.cookingTime.total}min</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RestaurantIcon fontSize="small" />
                Instructions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {meal.instructions}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Detailed Nutrition</Typography>
              <Grid container spacing={2}>
                {meal.macros.calories !== undefined && meal.macros.calories !== null && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Calories: {meal.macros.calories}kcal
                    </Typography>
                  </Grid>
                )}
                {meal.macros.fiber !== undefined && meal.macros.fiber !== null && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Fiber: {meal.macros.fiber}g
                    </Typography>
                  </Grid>
                )}
                {meal.macros.sugar !== undefined && meal.macros.sugar !== null && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Sugar: {meal.macros.sugar}g
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>

            {meal.nutrients && (meal.nutrients.vitamins || meal.nutrients.minerals) && (
              <Box>
                <Typography variant="h6" gutterBottom>Nutrients</Typography>
                <Grid container spacing={2}>
                  {meal.nutrients.vitamins && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>Vitamins</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {meal.nutrients.vitamins.join(', ')}
                      </Typography>
                    </Grid>
                  )}
                  {meal.nutrients.minerals && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>Minerals</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {meal.nutrients.minerals.join(', ')}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}