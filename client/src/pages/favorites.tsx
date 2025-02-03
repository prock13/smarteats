import { useQuery } from "@tanstack/react-query";
import type { Recipe } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Favorites() {
  const { data: favorites, isLoading } = useQuery({
    queryKey: ['/api/favorites'],
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Favorite Recipes
          </h1>
          <p className="text-muted-foreground">
            Your saved favorite recipes from meal suggestions
          </p>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div>Loading favorite recipes...</div>
          ) : favorites?.length > 0 ? (
            favorites.map((recipe: Recipe) => (
              <Card key={recipe.id}>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">{recipe.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-muted-foreground">{recipe.description}</p>
                  <p className="mb-4">{recipe.instructions}</p>
                  
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
                    <Badge className="mt-4" variant="secondary">
                      {recipe.dietaryRestriction}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                No favorite recipes yet. Mark some recipes as favorites from the meal suggestions to see them here.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
