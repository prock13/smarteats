import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRecipeSchema, type InsertRecipe, type Recipe } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2 } from "lucide-react";
import { AutoSelectInput } from "@/components/ui/auto-select-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {Badge} from "@/components/ui/badge";
import { FavoriteButton, CelebrationAnimation } from "@/components/ui/celebration";

export default function Recipes() {
  const { toast } = useToast();
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['/api/recipes'],
  });

  const { data: favorites } = useQuery({
    queryKey: ['/api/favorites'],
  });

  const favoriteMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      const res = await apiRequest("POST", `/api/favorites/${recipeId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 500);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const unfavoriteMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      await apiRequest("DELETE", `/api/favorites/${recipeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
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
      toast({
        title: "Success!",
        description: "Recipe saved successfully"
      });
      form.reset();
      setEditingRecipe(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
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
        title: "Success!",
        description: "Recipe updated successfully"
      });
      form.reset();
      setEditingRecipe(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
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
        title: "Success!",
        description: "Recipe deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      {showCelebration && <CelebrationAnimation />}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Recipe Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage your custom recipes with macro nutrient information
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Recipes</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div>Loading recipes...</div>
                ) : recipes?.length > 0 ? (
                  <div className="space-y-4">
                    {recipes.map((recipe: Recipe) => (
                      <Card key={recipe.id} className="bg-muted/50">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                          <div>
                            <CardTitle className="text-lg font-medium">
                              {recipe.name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {recipe.description}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <FavoriteButton
                              isFavorite={favorites?.some((f: Recipe) => f.id === recipe.id) ?? false}
                              onClick={() => {
                                const isFavorite = favorites?.some((f: Recipe) => f.id === recipe.id);
                                if (isFavorite) {
                                  unfavoriteMutation.mutate(recipe.id);
                                } else {
                                  favoriteMutation.mutate(recipe.id);
                                }
                              }}
                              disabled={favoriteMutation.isPending || unfavoriteMutation.isPending}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(recipe)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this recipe?')) {
                                  deleteMutation.mutate(recipe.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Carbs:</span>{" "}
                              {recipe.carbs}g
                            </div>
                            <div>
                              <span className="text-muted-foreground">Protein:</span>{" "}
                              {recipe.protein}g
                            </div>
                            <div>
                              <span className="text-muted-foreground">Fats:</span>{" "}
                              {recipe.fats}g
                            </div>
                          </div>
                          {recipe.dietaryRestriction !== "none" && (
                            <Badge className="mt-2" variant="secondary">
                              {recipe.dietaryRestriction}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recipes yet. Create your first recipe using the form.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {editingRecipe ? 'Edit Recipe' : 'Create Recipe'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipe Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cooking Instructions</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-[100px]" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dietaryRestriction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dietary Restriction</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select dietary restriction" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Restrictions</SelectItem>
                            <SelectItem value="vegetarian">Vegetarian</SelectItem>
                            <SelectItem value="vegan">Vegan</SelectItem>
                            <SelectItem value="pescatarian">Pescatarian</SelectItem>
                            <SelectItem value="keto">Keto</SelectItem>
                            <SelectItem value="paleo">Paleo</SelectItem>
                            <SelectItem value="gluten-free">Gluten-Free</SelectItem>
                            <SelectItem value="dairy-free">Dairy-Free</SelectItem>
                            <SelectItem value="halal">Halal</SelectItem>
                            <SelectItem value="kosher">Kosher</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="carbs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Carbs (g)</FormLabel>
                          <FormControl>
                            <AutoSelectInput type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="protein"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Protein (g)</FormLabel>
                          <FormControl>
                            <AutoSelectInput type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fats"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fats (g)</FormLabel>
                          <FormControl>
                            <AutoSelectInput type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? "Saving..."
                        : (editingRecipe ? "Update Recipe" : "Create Recipe")}
                    </Button>
                    {editingRecipe && (
                      <Button 
                        type="button" 
                        variant="outline" 
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
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}