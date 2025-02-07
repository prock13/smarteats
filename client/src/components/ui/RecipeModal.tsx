import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRecipeSchema, type InsertRecipe } from "@shared/schema";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";

interface RecipeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InsertRecipe) => void;
  initialData?: Partial<InsertRecipe>;
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
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      instructions: initialData?.instructions || "",
      carbs: initialData?.carbs || 0,
      protein: initialData?.protein || 0,
      fats: initialData?.fats || 0,
      calories: initialData?.calories || null,
      fiber: initialData?.fiber || null,
      sugar: initialData?.sugar || null,
      cholesterol: initialData?.cholesterol || null,
      sodium: initialData?.sodium || null,
      cookingTime: initialData?.cookingTime || null,
      nutrients: initialData?.nutrients || null,
      dietaryRestriction: initialData?.dietaryRestriction || "none",
    },
  });

  const handleSubmit = async (data: InsertRecipe) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      keepMounted={false}
      disablePortal={false}
      PaperProps={{
        sx: {
          minHeight: '50vh',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1300,
        }
      }}
      sx={{
        '& .MuiDialog-paper': {
          margin: 2,
          borderRadius: 1,
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        '& .MuiDialog-container': {
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <DialogTitle sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}>
        {initialData ? "Edit Recipe" : "Create New Recipe"}
      </DialogTitle>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Recipe Name"
              {...form.register("name")}
              error={!!form.formState.errors.name}
              helperText={form.formState.errors.name?.message}
              fullWidth
            />

            <TextField
              label="Description"
              {...form.register("description")}
              error={!!form.formState.errors.description}
              helperText={form.formState.errors.description?.message}
              multiline
              rows={2}
              fullWidth
            />

            <TextField
              label="Instructions"
              {...form.register("instructions")}
              error={!!form.formState.errors.instructions}
              helperText={form.formState.errors.instructions?.message}
              multiline
              rows={4}
              fullWidth
            />

            <FormControl fullWidth>
              <FormLabel>Dietary Restriction</FormLabel>
              <Select
                {...form.register("dietaryRestriction")}
                defaultValue="none"
                fullWidth
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
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <LoadingButton 
            type="submit" 
            loading={isSubmitting}
            variant="contained"
            color="primary"
          >
            {initialData ? "Update Recipe" : "Create Recipe"}
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}