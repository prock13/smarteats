import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  macroInputSchema,
  type MacroInput,
  mealTypeEnum,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Badge,
  IconButton,
  FormControl,
  FormLabel,
  FormHelperText,
  LinearProgress,
  Menu,
  Collapse,
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  Add as PlusCircle,
  Favorite,
  FavoriteBorder,
  Share as ShareIcon,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  AccessTime as AccessTimeIcon,
  Restaurant as RestaurantIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import type { Recipe } from "@shared/schema";
import type { IconButtonProps } from "@mui/material/IconButton";
import { RecipeCard } from "@/components/ui/RecipeCard";

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})({
  transform: (props: ExpandMoreProps) =>
    props.expand ? "rotate(180deg)" : "rotate(0deg)",
  marginLeft: "auto",
  transition: (theme) =>
    theme.transitions.create("transform", {
      duration: theme.transitions.duration.shortest,
    }),
});

const mealTypeOptions = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
  { label: "Snack", value: "snack" },
];

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

export default function Planner() {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<any>(null);
  const [selectedMealType, setSelectedMealType] = useState<string>("breakfast");
  const [showingMore, setShowingMore] = useState(false);
  const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
  const [sharingMeal, setSharingMeal] = useState<any>(null);
  const [expandedCards, setExpandedCards] = useState<{
    [key: number]: boolean;
  }>({});

  const queryClient = useQueryClient();
  const { data: favorites } = useQuery<Recipe[]>({
    queryKey: ["/api/favorites"],
    queryFn: () =>
      apiRequest("GET", "/api/favorites").then((res) => res.json()),
  });

  const form = useForm<MacroInput>({
    resolver: zodResolver(macroInputSchema),
    defaultValues: {
      targetCarbs: 0,
      targetProtein: 0,
      targetFats: 0,
      mealTypes: [],
      dietaryPreference: "none",
      mealCount: 1,
      includeUserRecipes: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: MacroInput & { appendResults?: boolean }) => {
      const requestData = {
        ...data,
        excludeRecipes:
          data.appendResults && suggestions?.meals
            ? suggestions.meals.map((meal: any) => meal.name)
            : [],
      };

      const res = await apiRequest(
        "POST",
        "/api/meal-suggestions",
        requestData,
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to get meal suggestions");
      }

      return { response: await res.json(), appendResults: data.appendResults };
    },
    onSuccess: (data) => {
      const { response, appendResults } = data;

      if (!response || !response.suggestions) {
        toast({
          title: "Error",
          description: "No meal suggestions received",
          variant: "destructive",
        });
        return;
      }

      if (appendResults && suggestions?.meals) {
        setSuggestions({
          ...response.suggestions,
          meals: [...suggestions.meals, ...response.suggestions.meals],
        });
      } else {
        setSuggestions(response.suggestions);
      }

      setShowingMore(false);
      toast({
        title: "Success!",
        description: appendResults
          ? "More meal suggestions added"
          : "Here are your meal suggestions",
      });
    },
    onError: (error: Error) => {
      setShowingMore(false);
      let description = error.message;
      if (error.message.includes("Rate limit exceeded")) {
        const waitTimeMatch = error.message.match(/wait (\d+) seconds/);
        const waitTime = waitTimeMatch ? waitTimeMatch[1] : "a few";
        description = `You've made too many requests. Please wait ${waitTime} seconds before trying again.`;
      }
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
      setSuggestions(null);
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
        instructions: meal.description,
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

  const onSubmit = (data: MacroInput) => {
    if (!data.mealTypes || data.mealTypes.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one meal type",
        variant: "destructive",
      });
      return;
    }
    data.mealCount = data.mealTypes.length;
    mutation.mutate(data);
  };

  const handleShowMore = () => {
    setShowingMore(true);
    const currentData = form.getValues();
    mutation.mutate({ ...currentData, appendResults: true });
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

    const shareText = `Check out this healthy recipe from Smart Meal Planner!\n\nRecipe: ${sharingMeal.name}\n${sharingMeal.description}\n\nNutritional Info:\n• Carbs: ${sharingMeal.macros.carbs}g\n• Protein: ${sharingMeal.macros.protein}g\n• Fats: ${sharingMeal.macros.fats}g\n\nDiscover more recipes at: ${window.location.origin}`;
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
      default:
        if (navigator.share) {
          try {
            await navigator.share({
              title: `${sharingMeal.name} - Smart Meal Planner`,
              text: shareText,
              url: baseUrl,
            });
            toast({
              title: "Success!",
              description: "Recipe shared successfully",
            });
          } catch (error) {
            console.error("Error sharing:", error);
          }
          handleShareClose();
          return;
        }
    }

    if (platformUrl) {
      window.open(platformUrl, "_blank", "noopener,noreferrer");
    }
    handleShareClose();
  };

  const handleMealTypeChange = (
    checked: boolean,
    value: keyof typeof mealTypeEnum,
  ) => {
    const currentValues = form.watch("mealTypes") || [];
    if (checked) {
      form.setValue("mealTypes", [...currentValues, value]);
    } else {
      form.setValue(
        "mealTypes",
        currentValues.filter((type) => type !== value),
      );
    }
  };

  const handleExpandClick = (index: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
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
            Macro Meal Planner
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your remaining macros and get AI-powered meal suggestions
          </Typography>
        </Box>

        <Card sx={{ mb: 4 }}>
          <CardHeader title="Enter Your Remaining Macros" />
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Carbohydrates (g)"
                    type="number"
                    {...form.register("targetCarbs", { valueAsNumber: true })}
                    error={!!form.formState.errors.targetCarbs}
                    helperText={form.formState.errors.targetCarbs?.message}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Protein (g)"
                    type="number"
                    {...form.register("targetProtein", { valueAsNumber: true })}
                    error={!!form.formState.errors.targetProtein}
                    helperText={form.formState.errors.targetProtein?.message}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Fats (g)"
                    type="number"
                    {...form.register("targetFats", { valueAsNumber: true })}
                    error={!!form.formState.errors.targetFats}
                    helperText={form.formState.errors.targetFats?.message}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <FormLabel>Meal Types</FormLabel>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      {mealTypeOptions.map((option) => (
                        <FormControlLabel
                          key={option.value}
                          control={
                            <Checkbox
                              checked={form
                                .watch("mealTypes")
                                ?.includes(
                                  option.value as keyof typeof mealTypeEnum,
                                )}
                              onChange={(e) => {
                                handleMealTypeChange(
                                  e.target.checked,
                                  option.value as keyof typeof mealTypeEnum,
                                );
                              }}
                            />
                          }
                          label={option.label}
                        />
                      ))}
                    </Box>
                    {form.formState.errors.mealTypes && (
                      <FormHelperText error>
                        {form.formState.errors.mealTypes.message}
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
                      fullWidth
                    >
                      {dietaryOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <FormLabel>&nbsp;</FormLabel>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            {...form.register("includeUserRecipes")}
                            defaultChecked={true}
                          />
                        }
                        label="Include My Recipes"
                      />
                    </Box>
                  </FormControl>
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
                        <CircularProgress size={24} sx={{ mr: 1 }} />
                        Generating Suggestions...
                      </>
                    ) : (
                      "Get Meal Suggestions"
                    )}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>

        {mutation.isPending && !suggestions && (
          <Box sx={{ width: "100%", mt: 4 }}>
            <LinearProgress />
          </Box>
        )}

        {suggestions?.meals && suggestions.meals.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={3}>
              {suggestions.meals.map((meal: any, index: number) => (
                <Grid item xs={12} md={6} key={index}>
                  <RecipeCard
                    meal={meal}
                    onShare={handleShareClick}
                    targetMacros={{
                      carbs: form.getValues("targetCarbs"),
                      protein: form.getValues("targetProtein"),
                      fats: form.getValues("targetFats"),
                    }}
                    favorites={favorites}
                    showAddToCalendar={true}
                  />
                </Grid>
              ))}
            </Grid>

            {!showingMore && suggestions.meals.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <Button
                  onClick={handleShowMore}
                  variant="outlined"
                  disabled={mutation.isPending}
                  startIcon={
                    mutation.isPending ? (
                      <CircularProgress size={20} />
                    ) : (
                      <PlusCircle />
                    )
                  }
                >
                  {mutation.isPending ? "Loading..." : "Show More Options"}
                </Button>
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
          </Box>
        )}
      </Container>
    </Box>
  );
}
