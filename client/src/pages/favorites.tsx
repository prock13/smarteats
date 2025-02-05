import { useQuery } from "@tanstack/react-query";
import type { Recipe } from "@shared/schema";
import { Container, Typography, Box, Grid, CircularProgress, Menu, MenuItem } from "@mui/material";
import { RecipeCard } from "@/components/ui/RecipeCard";
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';
import { Twitter as TwitterIcon, Facebook as FacebookIcon, LinkedIn as LinkedInIcon } from "@mui/icons-material";

export default function Favorites() {
  const { toast } = useToast();
  const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
  const [sharingRecipe, setSharingRecipe] = useState<Recipe | null>(null);

  const { data: favorites, isLoading, error } = useQuery<Recipe[]>({
    queryKey: ["/api/favorites"],
  });

  const handleShare = (event: React.MouseEvent<HTMLElement>, recipe: Recipe) => {
    setShareAnchorEl(event.currentTarget);
    setSharingRecipe(recipe);
  };

  const handleShareClose = () => {
    setShareAnchorEl(null);
    setSharingRecipe(null);
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
              {favorites.map((recipe: Recipe) => (
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
                        calories: recipe.calories || 0,
                        fiber: recipe.fiber || 0,
                        sugar: recipe.sugar || 0
                      },
                      cookingTime: recipe.cooking_time || {
                        prep: 15,
                        cook: 20,
                        total: 35
                      },
                      nutrients: recipe.nutrients || {},
                      dietaryRestriction: recipe.dietaryRestriction,
                      isStoredRecipe: true
                    }}
                    targetMacros={{
                      carbs: recipe.carbs,
                      protein: recipe.protein,
                      fats: recipe.fats
                    }}
                    onShare={handleShare}
                    showAddToCalendar={true}
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