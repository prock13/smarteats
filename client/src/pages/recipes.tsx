import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRecipeSchema, type InsertRecipe, type Recipe } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  CircularProgress
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";


export default function Recipes() {
  const { toast } = useToast();
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['/api/recipes'],
  });

  const form = useForm<InsertRecipe>({
    resolver: zodResolver(insertRecipeSchema),
    defaultValues: {
      name: "",
      description: "",
      instructions: "",
      carbs: 0,
      protein: 0,
      fats: 0,
      dietaryRestriction: "none",
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertRecipe) => {
      const res = await apiRequest("POST", "/api/recipes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast("Recipe saved successfully", { severity: "success" });
      form.reset();
      setEditingRecipe(null);
    },
    onError: (error) => {
      toast(error.message, { severity: "error" });
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
      toast("Recipe updated successfully", { severity: "success" });
      form.reset();
      setEditingRecipe(null);
    },
    onError: (error) => {
      toast(error.message, { severity: "error" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/recipes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast("Recipe deleted successfully", { severity: "success" });
    },
    onError: (error) => {
      toast(error.message, { severity: "error" });
    }
  });

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    form.reset({
      name: recipe.name,
      description: recipe.description,
      instructions: recipe.instructions,
      carbs: recipe.carbs,
      protein: recipe.protein,
      fats: recipe.fats,
      dietaryRestriction: recipe.dietaryRestriction as any,
    });
  };

  const onSubmit = (data: InsertRecipe) => {
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

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
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
                    No recipes yet. Create your first recipe using the form.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {editingRecipe ? 'Edit Recipe' : 'Create Recipe'}
              </Typography>

              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Recipe Name"
                    {...form.register("name")}
                    error={!!form.formState.errors.name}
                    helperText={form.formState.errors.name?.message}
                    fullWidth
                  />

                  <TextField
                    label="Short Description"
                    {...form.register("description")}
                    error={!!form.formState.errors.description}
                    helperText={form.formState.errors.description?.message}
                    multiline
                    rows={2}
                    fullWidth
                  />

                  <TextField
                    label="Cooking Instructions"
                    {...form.register("instructions")}
                    error={!!form.formState.errors.instructions}
                    helperText={form.formState.errors.instructions?.message}
                    multiline
                    rows={4}
                    fullWidth
                  />

                  <FormControl fullWidth>
                    <InputLabel>Dietary Restriction</InputLabel>
                    <Select
                      {...form.register("dietaryRestriction")}
                      error={!!form.formState.errors.dietaryRestriction}
                      label="Dietary Restriction"
                      defaultValue="none"
                    >
                      <MenuItem value="none">No Restrictions</MenuItem>
                      <MenuItem value="vegetarian">Vegetarian</MenuItem>
                      <MenuItem value="vegan">Vegan</MenuItem>
                      <MenuItem value="pescatarian">Pescatarian</MenuItem>
                      <MenuItem value="keto">Keto</MenuItem>
                      <MenuItem value="paleo">Paleo</MenuItem>
                      <MenuItem value="gluten-free">Gluten-Free</MenuItem>
                      <MenuItem value="dairy-free">Dairy-Free</MenuItem>
                      <MenuItem value="halal">Halal</MenuItem>
                      <MenuItem value="kosher">Kosher</MenuItem>
                    </Select>
                  </FormControl>

                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField
                        label="Carbs (g)"
                        type="number"
                        {...form.register("carbs", { valueAsNumber: true })}
                        error={!!form.formState.errors.carbs}
                        helperText={form.formState.errors.carbs?.message}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="Protein (g)"
                        type="number"
                        {...form.register("protein", { valueAsNumber: true })}
                        error={!!form.formState.errors.protein}
                        helperText={form.formState.errors.protein?.message}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="Fats (g)"
                        type="number"
                        {...form.register("fats", { valueAsNumber: true })}
                        error={!!form.formState.errors.fats}
                        helperText={form.formState.errors.fats?.message}
                        fullWidth
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      fullWidth
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? "Saving..."
                        : (editingRecipe ? "Update Recipe" : "Create Recipe")}
                    </Button>
                    {editingRecipe && (
                      <Button 
                        variant="outlined" 
                        onClick={() => {
                          setEditingRecipe(null);
                          form.reset({
                            name: "",
                            description: "",
                            instructions: "",
                            carbs: 0,
                            protein: 0,
                            fats: 0,
                            dietaryRestriction: "none",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </Box>
                </Box>
              </form>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}