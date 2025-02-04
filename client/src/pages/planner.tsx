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

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: expand ? 'rotate(180deg)' : 'rotate(0deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

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
  const [expandedCards, setExpandedCards] = useState<{[key: number]: boolean}>({});

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
      if (description.includes("Rate limit exceeded")) {
        const waitTime =
          description.match(/wait (\d+) seconds/)?.[1] || "a few minutes";
        description = `You've made too many requests. Please wait ${waitTime} before trying again.`;
      }
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
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
          <Typography variant="h4" component="h1" gutterBottom>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                      <FormControlLabel
                        control={<Checkbox {...form.register("includeUserRecipes")} defaultChecked={true} />}
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
                            onClick={(e) => handleShareClick(e, meal)}
                            color="primary"
                            size="small"
                          >
                            <ShareIcon />
                          </IconButton>
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
                          {!meal.isStoredRecipe ? (
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
                          ) : (
                            <IconButton
                              color="primary"
                              size="small"
                              disabled
                            >
                              <PersonIcon fontSize="small" />
                            </IconButton>
                          )}
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
                              form.getValues("targetCarbs") > 0
                                ? (meal.macros.carbs /
                                  form.getValues("targetCarbs")) *
                                  100
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
                              form.getValues("targetProtein") > 0
                                ? (meal.macros.protein /
                                  form.getValues("targetProtein")) *
                                  100
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
                              form.getValues("targetFats") > 0
                                ? (meal.macros.fats /
                                  form.getValues("targetFats")) *
                                  100
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

                      {!meal.isStoredRecipe && (
                        <>
                          <Box sx={{ mt: 2 }}>
                            <Button
                              onClick={() => handleExpandClick(index)}
                              endIcon={<ExpandMoreIcon
                                sx={{
                                  transform: expandedCards[index] ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s'
                                }}
                              />}
                              sx={{ width: '100%', justifyContent: 'space-between' }}
                            >
                              {expandedCards[index] ? 'Show Less' : 'Show More Details'}
                            </Button>
                          </Box>

                          <Collapse in={expandedCards[index]} timeout="auto" unmountOnExit>
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
                                  {meal.macros.calories && (
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        Calories: {meal.macros.calories}kcal
                                      </Typography>
                                    </Grid>
                                  )}
                                  {meal.macros.fiber && (
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        Fiber: {meal.macros.fiber}g
                                      </Typography>
                                    </Grid>
                                  )}
                                  {meal.macros.sugar && (
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        Sugar: {meal.macros.sugar}g
                                      </Typography>
                                    </Grid>
                                  )}
                                </Grid>
                              </Box>

                              {(meal.nutrients?.vitamins || meal.nutrients?.minerals) && (
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
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

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
              {navigator.share && (
                <MenuItem onClick={() => shareRecipe("native")}>
                  <ShareIcon sx={{ mr: 1 }} /> Share via...
                </MenuItem>
              )}
            </Menu>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Button
                variant="outlined"
                onClick={handleShowMore}
                disabled={mutation.isPending || showingMore}
                startIcon={
                  showingMore ? <CircularProgress size={20} /> : <PlusCircle />
                }
              >
                {showingMore ? "Loading more..." : "Show More Options"}
              </Button>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}