import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRecipeSchema, type InsertRecipe } from "@shared/schema";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
} from "@mui/material";

interface RecipeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InsertRecipe) => void;
  initialData?: InsertRecipe;
  isSubmitting?: boolean;
}

export function RecipeModal({
  open,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}: RecipeModalProps) {
  const form = useForm<InsertRecipe>({
    resolver: zodResolver(insertRecipeSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      instructions: "",
      carbs: 0,
      protein: 0,
      fats: 0,
      dietaryRestriction: "none",
    },
  });

  const handleSubmit = (data: InsertRecipe) => {
    onSubmit(data);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {initialData ? "Edit Recipe" : "Create New Recipe"}
      </DialogTitle>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <DialogContent>
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{
              background: "linear-gradient(45deg, #2E7D32 30%, #1565C0 90%)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(45deg, #1B5E20 30%, #0D47A1 90%)",
              },
            }}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Saving...
              </>
            ) : (
              initialData ? "Update Recipe" : "Create Recipe"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
