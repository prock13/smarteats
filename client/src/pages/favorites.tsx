import { useQuery } from "@tanstack/react-query";

import { Container, Typography, Box, Grid, CircularProgress, Menu, MenuItem } from "@mui/material";
import { RecipeCard } from "@/components/ui/RecipeCard";
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';
import { Twitter as TwitterIcon, Facebook as FacebookIcon, LinkedIn as LinkedInIcon } from "@mui/icons-material";

interface Recipe {
  id: number;
  name: string;
  description: string;
  cookingTime: {
    prep: number;
    cook: number;
    total: number;
  };
  nutrients: {
    vitamins: string[];
    minerals: string[];
  };
  carbs: number;
  protein: number;
  fats: number;
  calories?: number;
  fiber?: number;
  sugar?: number;
  cholesterol?: number;
  sodium?: number;
  instructions: string;
  servingSize?: string;
  dietaryRestriction?: string[];
  tags?: string[];
}

export default function Favorites() {
  const { toast } = useToast();
  const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
  const [sharingRecipe, setSharingRecipe] = useState<Recipe | null>(null);
  const [expandedCards, setExpandedCards] = useState<{[key: number]: boolean}>({});

  const { data: favorites, isLoading, error } = useQuery<Recipe[]>({
    queryKey: ["/api/favorites"],
  });

  const handleShare = (event: React.MouseEvent<HTMLElement>, meal: any) => {
    setShareAnchorEl(event.currentTarget);
    setSharingRecipe(meal);
  };

  const handleShareClose = () => {
    setShareAnchorEl(null);
    setSharingRecipe(null);
  };

  const handleExpandClick = (index: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const shareRecipe = async (platform: string) => {
    if (!sharingRecipe) return;

    const shareText = `Check out this healthy recipe from Smart Meal Planner!\n\nRecipe: ${sharingRecipe.name}\n${sharingRecipe.description}\n\nNutritional Info:\n• Carbs: ${sharingRecipe.carbs}g\n• Protein: ${sharingRecipe.protein}g\n• Fats: ${sharingRecipe.fats}g\n\nDiscover more recipes at: ${window.location.origin}`;
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
              title: `${sharingRecipe.name} - Smart Meal Planner`,
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

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography color="error">
            Error loading favorites: {(error as Error).message}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ maxWidth: "4xl", mx: "auto", mb: 8 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
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
            Favorite Recipes
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Your saved favorite recipes from meal suggestions
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : favorites && favorites.length > 0 ? (
            <Grid container spacing={3}>
              {favorites.map((recipe: Recipe, index: number) => (
                <Grid item xs={12} md={6} key={recipe.id}>
                  <RecipeCard
                    meal={{
                      name: recipe.name,
                      description: recipe.description,
                      instructions: recipe.instructions,
                      macros: {
                        carbs: recipe.carbs,
                        protein: recipe.protein,
                        fats: recipe.fats,
                        calories: recipe.calories || null,
                        servingSize: recipe.servingSize || null,
                        fiber: recipe.fiber || null,
                        sugar: recipe.sugar || null,
                        cholesterol: recipe.cholesterol || null,
                        sodium: recipe.sodium || null
                      },
                      cookingTime: recipe.cookingTime || {
                        prep: 15,
                        cook: 20,
                        total: 35
                      },
                      nutrients: recipe.nutrients || {
                        vitamins: null,
                        minerals: null
                      },
                      dietaryRestriction: Array.isArray(recipe.dietaryRestriction) ? recipe.dietaryRestriction[0] : recipe.dietaryRestriction || "none",
                      isStoredRecipe: false 
                    }}
                    targetMacros={{
                      carbs: recipe.carbs,
                      protein: recipe.protein,
                      fats: recipe.fats
                    }}
                    onShare={handleShare}
                    onExpandClick={() => handleExpandClick(index)}
                    expanded={expandedCards[index] || false}
                    showAddToCalendar={true}
                    showDelete={true}
                    favorites={favorites}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography color="text.secondary">
                No favorite recipes yet. Mark some recipes as favorites from the
                meal suggestions to see them here.
              </Typography>
            </Box>
          )}
        </Box>

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
    </Container>
  );
}