import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { macroInputSchema, type MacroInput } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AutoSelectInput } from "@/components/ui/auto-select-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DietaryPreference } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<any>(null);

  const form = useForm<MacroInput>({
    resolver: zodResolver(macroInputSchema),
    defaultValues: {
      targetCarbs: 0,
      targetProtein: 0,
      targetFats: 0,
      mealCount: 1,
      dietaryPreference: "none",
      recipeLimit: undefined
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: MacroInput) => {
      const res = await apiRequest("POST", "/api/meal-suggestions", data);
      return res.json();
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions);
      toast({
        title: "Success!",
        description: "Here are your meal suggestions"
      });
    },
    onError: (error) => {
      let description = error.message;
      if (description.includes("Rate limit exceeded")) {
        const waitTime = description.match(/wait (\d+) seconds/)?.[1] || "a few minutes";
        description = `You've made too many requests. Please wait ${waitTime} before trying again.`;
      } else if (description.includes("OpenAI API rate limit")) {
        description = "OpenAI's rate limit has been reached. Please try again in a few minutes.";
      }
      toast({
        title: "Error",
        description,
        variant: "destructive"
      });
    }
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Macro Meal Planner
          </h1>
          <p className="text-muted-foreground">
            Enter your remaining macros and get AI-powered meal suggestions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enter Your Remaining Macros</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetCarbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carbohydrates (g)</FormLabel>
                        <FormControl>
                          <AutoSelectInput type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetProtein"
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
                    name="targetFats"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fats (g)</FormLabel>
                        <FormControl>
                          <AutoSelectInput type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mealCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Meals</FormLabel>
                        <FormControl>
                          <AutoSelectInput type="number" min="1" max="10" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dietaryPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dietary Preference</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select dietary preference" />
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
                  <FormField
                    control={form.control}
                    name="recipeLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Recipe Suggestions (Optional)</FormLabel>
                        <FormControl>
                          <AutoSelectInput 
                            type="number" 
                            min="1" 
                            max="20" 
                            placeholder="Unlimited"
                            {...field} 
                            value={field.value ?? ''} 
                            onChange={e => {
                              const val = e.target.value === '' ? undefined : Number(e.target.value);
                              field.onChange(val);
                            }} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? "Generating Suggestions..." : "Get Meal Suggestions"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {mutation.isPending && (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        )}

        {suggestions?.meals && (
          <div className="space-y-4">
            {suggestions.meals.map((meal: any, index: number) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>{meal.name}</CardTitle>
                  {meal.isStoredRecipe && (
                    <Badge variant="secondary">Saved Recipe</Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{meal.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Carbs</span>
                      <span>{meal.macros.carbs}g</span>
                    </div>
                    <Progress value={(meal.macros.carbs / form.getValues("targetCarbs")) * 100} className="bg-blue-200" />

                    <div className="flex items-center justify-between">
                      <span>Protein</span>
                      <span>{meal.macros.protein}g</span>
                    </div>
                    <Progress value={(meal.macros.protein / form.getValues("targetProtein")) * 100} className="bg-red-200" />

                    <div className="flex items-center justify-between">
                      <span>Fats</span>
                      <span>{meal.macros.fats}g</span>
                    </div>
                    <Progress value={(meal.macros.fats / form.getValues("targetFats")) * 100} className="bg-yellow-200" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}