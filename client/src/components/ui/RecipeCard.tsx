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
  TextField,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder,
  Share as ShareIcon,
  ExpandMore as ExpandMoreIcon,
  AccessTime as AccessTimeIcon,
  Restaurant as RestaurantIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Chip } from "@mui/material";

interface Macros {
  carbs: number;
  protein: number;
  fats: number;
  calories?: number | null;
  servingSize?: string | null;
  fiber?: number | null;
  sugar?: number | null;
  cholesterol?: number | null;
  sodium?: number | null;
}

interface CookingTime {
  prep: number | null;
  cook: number | null;
  total: number | null;
}

interface Nutrients {
  vitamins: string[] | null;
  minerals: string[] | null;
}

interface Meal {
  name: string;
  description: string;
  instructions: string;
  macros: Macros;
  cookingTime?: CookingTime | null;
  nutrients?: Nutrients | null;
  isStoredRecipe?: boolean;
  dietaryRestriction?: string;
}

interface RecipeCardProps {
  meal: Meal;
  onShare?: (event: React.MouseEvent<HTMLElement>, meal: Meal) => void;
  targetMacros?: {
    carbs: number;
    protein: number;
    fats: number;
  };
  favorites?: { name: string; id?: number; tags?: string[] }[];
  showAddToCalendar?: boolean;
  showDelete?: boolean;
  onDelete?: () => void;
  expanded?: boolean;
  onExpandClick?: () => void;
  mealType?: string;
}

export function RecipeCard({
  meal,
  onShare,
  targetMacros,
  favorites,
  showAddToCalendar = true,
  showDelete = false,
  onDelete,
  expanded = false,
  onExpandClick = () => {},
  mealType,
}: RecipeCardProps) {
  const { toast } = useToast();
  const [selectedMealType, setSelectedMealType] = useState<string>("dinner");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [newTag, setNewTag] = useState("");
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const favorite = favorites?.find((f) => f.name === meal.name);
  const [tags, setTags] = useState<string[]>(favorite?.tags || []);

  const updateTagsMutation = useMutation({
    mutationFn: async ({
      recipeId,
      tags,
    }: {
      recipeId: number;
      tags: string[];
    }) => {
      const res = await apiRequest("PATCH", `/api/favorites/${recipeId}`, {
        tags,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update tags");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Success",
        description: "Tags updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteFavoriteMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      const res = await apiRequest("DELETE", `/api/favorites/${recipeId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete favorite");
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Success",
        description: "Recipe removed from favorites",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addToCalendarMutation = useMutation({
    mutationFn: async ({
      meal,
      mealType,
      date,
    }: {
      meal: Meal;
      mealType: string;
      date: string;
    }) => {
      console.log("Adding to calendar:", { meal, mealType, date });
      const mealPlan = {
        date,
        meal: {
          name: meal.name,
          description: meal.description,
          macros: {
            carbs: meal.macros.carbs,
            protein: meal.macros.protein,
            fats: meal.macros.fats,
            servingSize: meal.macros.servingSize || null
          },
        },
        mealType,
      };
      const res = await apiRequest("POST", "/api/meal-plans", mealPlan);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add meal to calendar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({
        title: "Success",
        description: "Meal added to calendar",
      });
      setIsCalendarDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
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
        cholesterol: meal.macros.cholesterol,
        sodium: meal.macros.sodium,
        servingSize: meal.macros.servingSize,
        cookingTime: meal.cookingTime,
        nutrients: meal.nutrients,
        dietaryRestriction: meal.dietaryRestriction || "none",
      };
      const res = await apiRequest("POST", "/api/favorites", favorite);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Success",
        description: "Recipe saved to favorites",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteFavorite = (recipeId: number) => {
    if (confirm("Are you sure you want to remove this recipe from favorites?")) {
      deleteFavoriteMutation.mutate(recipeId);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else if (showDelete && favorite?.id) {
      handleDeleteFavorite(favorite.id);
    }
  };

  const mealTypeOptions = [
    { label: "Breakfast", value: "breakfast" },
    { label: "Lunch", value: "lunch" },
    { label: "Dinner", value: "dinner" },
    { label: "Snack", value: "snack" },
  ];

  const handleExpandClick = () => {
    onExpandClick();
  };

  const handleAddTag = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && newTag.trim() && favorite?.id) {
      event.preventDefault();
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      updateTagsMutation.mutate({ recipeId: favorite.id, tags: updatedTags });
      setNewTag("");
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    if (favorite?.id) {
      const updatedTags = tags.filter((tag) => tag !== tagToDelete);
      setTags(updatedTags);
      updateTagsMutation.mutate({ recipeId: favorite.id, tags: updatedTags });
    }
  };

  const handleAddToCalendar = () => {
    setIsCalendarDialogOpen(true);
  };

  const handleCalendarDialogClose = () => {
    setIsCalendarDialogOpen(false);
  };

  const handleCalendarSubmit = () => {
    console.log("Submitting calendar entry:", {
      meal,
      mealType: selectedMealType,
      date: selectedDate,
    });
    addToCalendarMutation.mutate({
      meal,
      mealType: selectedMealType,
      date: selectedDate,
    });
  };

  return (
    <>
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: (theme) => theme.shadows[8],
          },
          ...(meal.isStoredRecipe && {
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? "rgba(25, 118, 210, 0.02)"
                : "rgba(25, 118, 210, 0.05)",
          }),
        }}
      >
        {mealType && (
          <Chip
            label={mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            color="primary"
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 1,
              textTransform: "capitalize",
            }}
          />
        )}
        <CardHeader
          sx={{
            backgroundColor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            pb: 1,
            ...(mealType && { pl: 8 }),
          }}
          action={
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                alignItems: "center",
                pr: 1,
              }}
            >
              {onShare && (
                <IconButton
                  onClick={(e) => onShare(e, meal)}
                  color="primary"
                  size="small"
                >
                  <ShareIcon />
                </IconButton>
              )}
              {showAddToCalendar && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CalendarIcon />}
                  onClick={handleAddToCalendar}
                  sx={{
                    minWidth: "auto",
                    whiteSpace: "nowrap",
                    px: 2,
                  }}
                >
                  Add to Calendar
                </Button>
              )}
              {!meal.isStoredRecipe && favorites && !showDelete ? (
                <IconButton
                  color={favorites?.some((f) => f.name === meal.name) ? "primary" : "default"}
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
                    <FavoriteIcon />
                  ) : (
                    <FavoriteBorder />
                  )}
                </IconButton>
              ) : null}
              {showDelete && (
                <IconButton
                  color="error"
                  onClick={handleDelete}
                  disabled={deleteFavoriteMutation.isPending}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          }
        />
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
              pb: 1.5,
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              sx={{
                fontWeight: 600,
                flexGrow: 1,
              }}
            >
              {meal.name}
            </Typography>
          </Box>

          <Typography
            variant="body1"
            paragraph
            sx={{
              color: "text.secondary",
              lineHeight: 1.6,
              mb: 3,
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
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
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
                    backgroundColor: "action.hover",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                      backgroundColor: "primary.main",
                      transition: "transform 0.4s linear",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
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
                    backgroundColor: "action.hover",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                      backgroundColor: "success.main",
                      transition: "transform 0.4s linear",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
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
                    backgroundColor: "action.hover",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                      backgroundColor: "warning.main",
                      transition: "transform 0.4s linear",
                    },
                  }}
                />
              </Grid>
            </Grid>
          )}

          <Box sx={{ mt: 2 }}>
            <Button
              onClick={handleExpandClick}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              }
              sx={{ width: "100%", justifyContent: "space-between" }}
            >
              {expanded ? "Show Less" : "Show More Details"}
            </Button>
          </Box>

          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
              {meal.cookingTime && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <AccessTimeIcon fontSize="small" />
                    Cooking Time
                  </Typography>
                  <Grid container spacing={2}>
                    {meal.cookingTime.prep !== null && (
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Prep: {meal.cookingTime.prep}min
                        </Typography>
                      </Grid>
                    )}
                    {meal.cookingTime.cook !== null && (
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Cook: {meal.cookingTime.cook}min
                        </Typography>
                      </Grid>
                    )}
                    {meal.cookingTime.total !== null && (
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Total: {meal.cookingTime.total}min
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <RestaurantIcon fontSize="small" />
                  Instructions
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: "pre-line" }}
                >
                  {meal.instructions}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Nutritional Information
                </Typography>
                <Grid container spacing={2}>
                  {meal.macros.servingSize && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "medium" }}>
                        Serving Size: {meal.macros.servingSize}
                      </Typography>
                    </Grid>
                  )}
                  {meal.macros.calories !== undefined && meal.macros.calories !== null && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Calories: {meal.macros.calories}kcal
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
                  {meal.macros.fiber !== undefined && meal.macros.fiber !== null && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Fiber: {meal.macros.fiber}g
                      </Typography>
                    </Grid>
                  )}
                  {meal.macros.cholesterol !== undefined &&
                    meal.macros.cholesterol !== null && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Cholesterol: {meal.macros.cholesterol}mg
                        </Typography>
                      </Grid>
                    )}
                  {meal.macros.sodium !== undefined && meal.macros.sodium !== null && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Sodium: {meal.macros.sodium}mg
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {meal.nutrients &&
                (meal.nutrients.vitamins || meal.nutrients.minerals) && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Additional Nutrients
                    </Typography>
                    <Grid container spacing={2}>
                      {meal.nutrients.vitamins && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Vitamins
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {meal.nutrients.vitamins.join(", ")}
                          </Typography>
                        </Grid>
                      )}
                      {meal.nutrients.minerals && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Minerals
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {meal.nutrients.minerals.join(", ")}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                )}

              {showDelete && favorite && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Tags
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    {tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => handleDeleteTag(tag)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                  <TextField
                    fullWidth
                    size="small"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleAddTag}
                    placeholder="Add a tag (press Enter)"
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (newTag.trim() && favorite.id) {
                              const updatedTags = [...tags, newTag.trim()];
                              setTags(updatedTags);
                              updateTagsMutation.mutate({
                                recipeId: favorite.id,
                                tags: updatedTags,
                              });
                              setNewTag("");
                            }
                          }}
                        >
                          <AddIcon />
                        </IconButton>
                      ),
                    }}
                  />
                </Box>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      <Dialog
        open={isCalendarDialogOpen}
        onClose={handleCalendarDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            pb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Add to Calendar
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleCalendarDialogClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  sx={{ width: "100%" }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Select
                    value={selectedMealType}
                    onChange={(e) => setSelectedMealType(e.target.value)}
                    displayEmpty
                  >
                    {mealTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCalendarDialogClose}>Cancel</Button>
          <Button
            onClick={handleCalendarSubmit}
            variant="contained"
            disabled={addToCalendarMutation.isPending}
          >
            {addToCalendarMutation.isPending ? "Adding..." : "Add to Calendar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}