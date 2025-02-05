import { useQuery } from "@tanstack/react-query";
import type { Recipe } from "@shared/schema";
import { Container, Typography, Box, Paper, Grid, Chip } from "@mui/material";
import { CircularProgress } from "@mui/material";

export default function Favorites() {
  const {
    data: favorites,
    isLoading,
    error,
  } = useQuery<Recipe[]>({
    queryKey: ["/api/favorites"],
  });

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
                <Grid item xs={12} key={recipe.id}>
                  <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      {recipe.name}
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                      {recipe.description}
                    </Typography>
                    {recipe.instructions !== recipe.description && (
                      <Typography paragraph>{recipe.instructions}</Typography>
                    )}

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Carbs: {recipe.carbs}g
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Protein: {recipe.protein}g
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Fats: {recipe.fats}g
                        </Typography>
                      </Grid>
                    </Grid>

                    {recipe.dietaryRestriction !== "none" && (
                      <Chip
                        label={recipe.dietaryRestriction}
                        color="default"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">
                No favorite recipes yet. Mark some recipes as favorites from the
                meal suggestions to see them here.
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </Container>
  );
}
