import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  MenuItem,
  Select,
  TextField,
  FormControl,
  FormLabel,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  LinearProgress,
  Menu,
} from "@mui/material";
import {
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
} from "@mui/icons-material";
import { mealTypeEnum } from "@shared/schema";
import { RecipeCard } from "@/components/ui/RecipeCard";
import type { Recipe } from "@shared/schema";

const pantryInputSchema = z.object({
  carbSource: z.string().min(1, "Carbohydrate source is required"),
  proteinSource: z.string().min(1, "Protein source is required"),
  fatSource: z.string().min(1, "Fat source is required"),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  dietaryPreference: z.string(),
  includeUserRecipes: z.boolean().default(false),
});

type PantryInput = z.infer<typeof pantryInputSchema>;

const dietaryOptions = [
  { value: "none", label: "No Restrictions" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "dairy-free", label: "Dairy-Free" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
];

const mealTypeOptions = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
  { label: "Snack", value: "snack" },
];

export default function PantryPage() {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<any>(null);
  const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
  const [sharingMeal, setSharingMeal] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: favorites } = useQuery<Recipe[]>({
    queryKey: ["/api/favorites"],
  });

  const form = useForm<PantryInput>({
    resolver: zodResolver(pantryInputSchema),
    defaultValues: {
      carbSource: "",
      proteinSource: "",
      fatSource: "",
      mealType: "breakfast",
      dietaryPreference: "none",
      includeUserRecipes: false,
    },
  });

  const addToCalendarMutation = useMutation({
    mutationFn: async ({ meal, mealType }: { meal: any; mealType: string }) => {
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
        title: "Success!",
        description: "Meal added to today's calendar",
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

  const favoriteMutation = useMutation({
    mutationFn: async (meal: any) => {
      const favorite = {
        name: meal.name,
        description: meal.description,
        instructions: meal.instructions,
        carbs: meal.macros.carbs,
        protein: meal.macros.protein,
        fats: meal.macros.fats,
        dietaryRestriction: form.getValues("dietaryPreference"),
      };
      const res = await apiRequest("POST", "/api/favorites", favorite);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Success!",
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

  const mutation = useMutation({
    mutationFn: async (data: PantryInput) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 75000); // 75 second timeout

      try {
        const response = await apiRequest(
          "POST",
          "/api/pantry-suggestions",
          data,
          { signal: controller.signal },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to get pantry suggestions",
          );
        }

        const responseData = await response.json();
        clearTimeout(timeoutId);
        return responseData;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Received response:", data);
      if (!data?.suggestions?.meals?.length) {
        toast({
          title: "Error",
          description: "No meal suggestions found",
          variant: "destructive",
        });
        return;
      }

      setSuggestions(data.suggestions);
      toast({
        title: "Success",
        description: "Found meal suggestions based on your pantry items",
      });
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      let errorMessage = error.message;

      if (error.name === "AbortError") {
        errorMessage = "Request timed out. Please try again.";
      } else if (error.message.includes("Rate limit exceeded")) {
        const waitTimeMatch = error.message.match(/wait (\d+) seconds/);
        const waitTime = waitTimeMatch ? waitTimeMatch[1] : "a few";
        errorMessage = `You've made too many requests. Please wait ${waitTime} seconds before trying again.`;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setSuggestions(null);
    },
  });

  const onSubmit = (data: PantryInput) => {
    console.log("Submitting form data:", data);
    setSuggestions(null);
    mutation.mutate(data);
  };

  const handleShareClick = (
    event: React.MouseEvent<HTMLElement>,
    meal: any,
  ) => {
    setShareAnchorEl(event.currentTarget);
    setSharingMeal(meal);
  };

  const handleShareClose = () => {
    setShareAnchorEl(null);
    setSharingMeal(null);
  };

  const shareRecipe = async (platform: string) => {
    if (!sharingMeal) return;

    const shareText = `Check out this recipe from Smart Meal Planner!\n\nRecipe: ${sharingMeal.name}\n${sharingMeal.description}\n\nNutritional Info:\n• Carbs: ${sharingMeal.macros.carbs}g\n• Protein: ${sharingMeal.macros.protein}g\n• Fats: ${sharingMeal.macros.fats}g\n\nDiscover more recipes at: ${window.location.origin}`;
    const baseUrl = window.location.origin;

    let platformUrl = "";
    switch (platform) {
      case "twitter":
        platformUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(baseUrl)}`;
        break;
      case "facebook":
        platformUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case "linkedin":
        platformUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(baseUrl)}`;
        break;
    }

    if (platformUrl) {
      window.open(platformUrl, "_blank", "noopener,noreferrer");
    }
    handleShareClose();
  };

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
            Pantry Recipe Finder
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter the ingredients you have on hand and get AI-powered recipe
            suggestions
          </Typography>
        </Box>

        <Card sx={{ mb: 4 }}>
          <CardHeader title="Enter Your Available Ingredients" />
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    label="Carbohydrate Source"
                    placeholder="e.g., Rice, Potatoes, Pasta"
                    {...form.register("carbSource")}
                    error={!!form.formState.errors.carbSource}
                    helperText={form.formState.errors.carbSource?.message}
                    disabled={mutation.isPending}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    label="Protein Source"
                    placeholder="e.g., Chicken, Tofu, Fish"
                    {...form.register("proteinSource")}
                    error={!!form.formState.errors.proteinSource}
                    helperText={form.formState.errors.proteinSource?.message}
                    disabled={mutation.isPending}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    label="Fat Source"
                    placeholder="e.g., Olive Oil, Avocado, Nuts"
                    {...form.register("fatSource")}
                    error={!!form.formState.errors.fatSource}
                    helperText={form.formState.errors.fatSource?.message}
                    disabled={mutation.isPending}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <FormLabel>Meal Type</FormLabel>
                    <Select
                      {...form.register("mealType")}
                      defaultValue="dinner"
                      disabled={mutation.isPending}
                    >
                      {mealTypeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {form.formState.errors.mealType && (
                      <FormHelperText error>
                        {form.formState.errors.mealType.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <FormLabel>Dietary Preference</FormLabel>
                    <Select
                      {...form.register("dietaryPreference")}
                      defaultValue="none"
                      disabled={mutation.isPending}
                    >
                      {dietaryOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...form.register("includeUserRecipes")}
                        defaultChecked={false}
                        disabled={mutation.isPending}
                      />
                    }
                    label="Include My Recipes"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={mutation.isPending}
                    sx={{
                      py: 1.5,
                      background:
                        "linear-gradient(45deg, #2E7D32 30%, #1565C0 90%)",
                      color: "white",
                      "&:hover": {
                        background:
                          "linear-gradient(45deg, #1B5E20 30%, #0D47A1 90%)",
                      },
                    }}
                  >
                    {mutation.isPending ? (
                      <>
                        <CircularProgress
                          size={24}
                          sx={{ mr: 1 }}
                          color="inherit"
                        />
                        Generating Suggestions...
                      </>
                    ) : (
                      "Get Recipe Suggestions"
                    )}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>

        {mutation.isPending && (
          <Box sx={{ width: "100%", mt: 4 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mb: 2 }}
            >
              Please wait while we generate your personalized recipe
              suggestions...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {suggestions?.meals && suggestions.meals.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Recipe Suggestions
            </Typography>
            <Grid container spacing={3}>
              {suggestions.meals.map((meal: any, index: number) => (
                <Grid item xs={12} md={6} key={index}>
                  <RecipeCard
                    meal={meal}
                    onShare={handleShareClick}
                    targetMacros={{
                      carbs: meal.macros.carbs,
                      protein: meal.macros.protein,
                      fats: meal.macros.fats,
                    }}
                    favorites={favorites}
                    showAddToCalendar={true}
                    addToCalendar={addToCalendarMutation.mutate}
                    isFavorite={favorites?.some(
                      (fav) => fav.name === meal.name,
                    )}
                    favoriteRecipe={favoriteMutation.mutate}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Menu
          anchorEl={shareAnchorEl}
          open={Boolean(shareAnchorEl)}
          onClose={handleShareClose}
        >
          <MenuItem onClick={() => shareRecipe("twitter")}>
            <TwitterIcon sx={{ mr: 1 }} /> Share on Twitter
          </MenuItem>
          <MenuItem onClick={() => shareRecipe("facebook")}>
            <FacebookIcon sx={{ mr: 1 }} /> Share on Facebook
          </MenuItem>
          <MenuItem onClick={() => shareRecipe("linkedin")}>
            <LinkedInIcon sx={{ mr: 1 }} /> Share on LinkedIn
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
}
