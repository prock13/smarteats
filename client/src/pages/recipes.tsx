import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertRecipeSchema, type InsertRecipe, type Recipe } from "@shared/schema";
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
  Fab,
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
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertRecipe) => {
      const res = await apiRequest("POST", "/api/recipes", data);
      return res.json();
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertRecipe & { id: number }) => {
      const { id, ...recipe } = data;
      const res = await apiRequest("PUT", `/api/recipes/${id}`, recipe);
      return res.json();
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/recipes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Success",
        description: "Recipe deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecipe(null);
  };

  const handleSubmit = (data: InsertRecipe) => {
    if (editingRecipe) {
      updateMutation.mutate({ ...data, id: editingRecipe.id });
    } else {
      createMutation.mutate(data);
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
          <Typography variant="h6" gutterBottom>Your Recipes</Typography>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : recipes?.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              {recipes.map((recipe: Recipe) => (
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
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No recipes yet. Create your first recipe using the + button.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: "linear-gradient(45deg, #2E7D32 30%, #1565C0 90%)",
          '&:hover': {
            background: "linear-gradient(45deg, #1B5E20 30%, #0D47A1 90%)",
          }
        }}
        onClick={() => setIsModalOpen(true)}
      >
        <AddIcon />
      </Fab>

      <RecipeModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editingRecipe || undefined}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </Container>
  );
}