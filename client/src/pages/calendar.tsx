import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type InsertMealPlan } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function CalendarPage() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedMealType, setSelectedMealType] = useState<string>("breakfast");

  const startOfMonth = new Date(date?.getFullYear() || 2024, date?.getMonth() || 0, 1);
  const endOfMonth = new Date(date?.getFullYear() || 2024, (date?.getMonth() || 0) + 1, 0);

  const { data: mealPlans, isLoading } = useQuery({
    queryKey: ["/api/meal-plans", startOfMonth.toISOString(), endOfMonth.toISOString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/meal-plans?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch meal plans");
      return res.json();
    },
  });

  const addMealPlan = useMutation({
    mutationFn: async (plan: InsertMealPlan) => {
      const res = await apiRequest("POST", "/api/meal-plans", plan);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({
        title: "Success",
        description: "Meal plan added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMealPlan = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/meal-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({
        title: "Success",
        description: "Meal plan deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const mealsByDate = mealPlans?.reduce((acc: Record<string, any[]>, plan: any) => {
    const dateStr = format(new Date(plan.date), "yyyy-MM-dd");
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(plan);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Meal Planning Calendar
          </h1>
          <p className="text-muted-foreground">
            Plan your meals and track your nutrition goals
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[300px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                modifiers={{
                  booked: (date) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    return !!mealsByDate?.[dateStr]?.length;
                  },
                }}
                modifiersStyles={{
                  booked: { backgroundColor: "hsl(var(--primary) / 0.1)" },
                }}
              />
              {date && (
                <div className="mt-4 space-y-4">
                  <Select
                    value={selectedMealType}
                    onValueChange={setSelectedMealType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select meal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {date ? format(date, "MMMM d, yyyy") : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Loading...</div>
              ) : date ? (
                <div className="space-y-4">
                  {mealsByDate?.[format(date, "yyyy-MM-dd")]?.map((plan: any) => (
                    <Card key={plan.id} className="bg-muted/50">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          {plan.mealType.charAt(0).toUpperCase() + plan.mealType.slice(1)}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMealPlan.mutate(plan.id)}
                        >
                          Remove
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          <div className="font-medium">{plan.meal.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {plan.meal.description}
                          </div>
                          <div className="text-sm">
                            Macros: {plan.meal.macros.carbs}g carbs, {plan.meal.macros.protein}g protein, {plan.meal.macros.fats}g fats
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )) || <div className="text-muted-foreground">No meals planned for this date</div>}
                </div>
              ) : (
                <div className="text-muted-foreground">Select a date to view or plan meals</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
