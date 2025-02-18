import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type InsertRecipe, type Recipe } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RecipeModal } from "@/components/ui/RecipeModal";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  IconButton,
  Chip,
  CircularProgress,
  Button,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";

export default function Recipes() {
  const { toast } = useToast();
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ['/api/recipes'],
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertRecipe) => {
      console.log("Creating recipe with data:", data);
      const response = await apiRequest("POST", "/api/recipes", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create recipe');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Success",
        description: "Recipe saved successfully",
      });
      handleCloseModal();
    },
    onError: (error: Error) => {
      console.error("Error creating recipe:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertRecipe & { id: number }) => {
      console.log("Updating recipe with data:", data);
      const { id, ...recipe } = data;
      const response = await apiRequest("PUT", `/api/recipes/${id}`, recipe);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update recipe');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Success",
        description: "Recipe updated successfully",
      });
      handleCloseModal();
    },
    onError: (error: Error) => {
      console.error("Error updating recipe:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log("Deleting recipe with id:", id);
      const response = await apiRequest("DELETE", `/api/recipes/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete recipe');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Success",
        description: "Recipe deleted successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Error deleting recipe:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEdit = (recipe: Recipe) => {
    console.log("Editing recipe:", recipe);
    setEditingRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleOpenModal = () => {
    setEditingRecipe(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecipe(null);
  };

  const handleSubmit = async (data: InsertRecipe) => {
    console.log("Submitting recipe data:", data);
    try {
      if (editingRecipe) {
        await updateMutation.mutateAsync({ ...data, id: editingRecipe.id });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error("Error submitting recipe:", error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ maxWidth: '6xl', mx: 'auto', mb: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1"
            sx={{
              background: 'linear-gradient(45deg, #4CAF50 30%, #2196F3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}>
            Recipe Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Create and manage your custom recipes with macro nutrient information
          </Typography>
        </Box>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3
          }}>
            <Typography variant="h6">Your Recipes</Typography>
            <Button
              variant="contained"
              startIcon={createMutation.isPending ? null : <AddIcon />}
              onClick={handleOpenModal}
              disabled={createMutation.isPending}
              sx={{
                py: 1.5,
                background: "linear-gradient(45deg, #2E7D32 30%, #1565C0 90%)",
                color: "white",
                "&:hover": {
                  background: "linear-gradient(45deg, #1B5E20 30%, #0D47A1 90%)",
                },
              }}
            >
              {createMutation.isPending ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Generating Recipe...
                </>
              ) : (
                "Add Recipe"
              )}
            </Button>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : recipes && recipes.length > 0 ? (
            <>
              <Box sx={{ mt: 2 }}>
                {recipes?.map((recipe: Recipe) => (
                  <Paper
                    key={recipe.id}
                    elevation={1}
                    sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="h6">{recipe.name}</Typography>
                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                          {recipe.description}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(recipe)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this recipe?')) {
                              deleteMutation.mutate(recipe.id);
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {recipe.servingSize && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                            Serving Size: {recipe.servingSize}
                          </Typography>
                        </Grid>
                      )}
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
                        size="small"
                        sx={{ mt: 2 }}
                      />
                    )}
                  </Paper>
                ))}
              </Box>
            </>
          )}

          {createMutation.isPending && (
            <Box sx={{ width: "100%", mt: 4 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ mb: 2 }}
              >
                Please wait while we generate your personalized recipe suggestions...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {!isLoading && recipes && recipes.length > 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Button
                onClick={() => handleOpenModal()}
                variant="outlined"
                disabled={createMutation.isPending}
                startIcon={
                  createMutation.isPending ? (
                    <CircularProgress size={20} />
                  ) : (
                    <AddIcon />
                  )
                }
              >
                {createMutation.isPending ? "Loading..." : "Show More Recipes"}
              </Button>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No recipes yet. Click the "Add Recipe" button to create your first recipe.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <RecipeModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editingRecipe ? {
          name: editingRecipe.name,
          description: editingRecipe.description,
          instructions: editingRecipe.instructions,
          carbs: editingRecipe.carbs,
          protein: editingRecipe.protein,
          fats: editingRecipe.fats,
          calories: editingRecipe.calories,
          servingSize: editingRecipe.servingSize,
          fiber: editingRecipe.fiber,
          sugar: editingRecipe.sugar,
          cholesterol: editingRecipe.cholesterol,
          sodium: editingRecipe.sodium,
          cookingTime: editingRecipe.cookingTime as { prep: number | null; cook: number | null; total: number | null; } | null,
          nutrients: editingRecipe.nutrients as { vitamins: string[] | null; minerals: string[] | null; } | null,
          dietaryRestriction: editingRecipe.dietaryRestriction as "none" | "vegetarian" | "vegan" | "pescatarian" | "keto" | "paleo" | "gluten-free" | "dairy-free" | "halal" | "kosher"
        } : undefined}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </Container>
  );
}