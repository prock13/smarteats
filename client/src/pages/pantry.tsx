import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
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
  FormControl,
  FormLabel,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import { mealTypeEnum } from "@shared/schema";

const pantryInputSchema = z.object({
  carbSource: z.string().min(1, "Carbohydrate source is required"),
  proteinSource: z.string().min(1, "Protein source is required"),
  fatSource: z.string().min(1, "Fat source is required"),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  dietaryPreference: z.string(),
  includeUserRecipes: z.boolean().default(false),
});

type PantryInput = z.infer<typeof pantryInputSchema>;

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

const mealTypeOptions = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
  { label: "Snack", value: "snack" },
];

export default function PantryPage() {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<any>(null);

  const form = useForm<PantryInput>({
    resolver: zodResolver(pantryInputSchema),
    defaultValues: {
      carbSource: "",
      proteinSource: "",
      fatSource: "",
      mealType: "dinner",
      dietaryPreference: "none",
      includeUserRecipes: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PantryInput) => {
      const res = await apiRequest(
        "POST",
        "/api/pantry-suggestions",
        data,
      );
      return res.json();
    },
    onSuccess: (data) => {
      if (!data || !data.suggestions) {
        toast({
          title: "Error",
          description: "No meal suggestions received",
          variant: "destructive",
        });
        return;
      }

      setSuggestions(data.suggestions);
      toast({
        title: "Success!",
        description: "Here are your meal suggestions based on your pantry items",
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

  const onSubmit = (data: PantryInput) => {
    mutation.mutate(data);
  };

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Pantry Recipe Finder
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter the ingredients you have on hand and get AI-powered recipe suggestions
          </Typography>
        </Box>

        <Card sx={{ mb: 4 }}>
          <CardHeader title="Enter Your Available Ingredients" />
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    label="Carbohydrate Source"
                    placeholder="e.g., Rice, Potatoes, Pasta"
                    {...form.register("carbSource")}
                    error={!!form.formState.errors.carbSource}
                    helperText={form.formState.errors.carbSource?.message}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    label="Protein Source"
                    placeholder="e.g., Chicken, Tofu, Fish"
                    {...form.register("proteinSource")}
                    error={!!form.formState.errors.proteinSource}
                    helperText={form.formState.errors.proteinSource?.message}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    label="Fat Source"
                    placeholder="e.g., Olive Oil, Avocado, Nuts"
                    {...form.register("fatSource")}
                    error={!!form.formState.errors.fatSource}
                    helperText={form.formState.errors.fatSource?.message}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <FormLabel>Meal Type</FormLabel>
                    <Select
                      {...form.register("mealType")}
                      defaultValue="dinner"
                    >
                      {mealTypeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {form.formState.errors.mealType && (
                      <FormHelperText error>
                        {form.formState.errors.mealType.message}
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
                    >
                      {dietaryOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...form.register("includeUserRecipes")}
                        defaultChecked={false}
                      />
                    }
                    label="Include My Recipes"
                  />
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
                      "Get Recipe Suggestions"
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
            <Typography variant="h5" gutterBottom>
              Recipe Suggestions
            </Typography>
            <Grid container spacing={3}>
              {suggestions.meals.map((meal: any, index: number) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card>
                    <CardHeader title={meal.name} />
                    <CardContent>
                      <Typography variant="body1" paragraph>
                        {meal.description}
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        Instructions
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {meal.instructions}
                      </Typography>
                      {meal.cookingTime && (
                        <Typography variant="body2" color="text.secondary">
                          Cooking Time: {meal.cookingTime.total} minutes (Prep: {meal.cookingTime.prep}, Cook: {meal.cookingTime.cook})
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}