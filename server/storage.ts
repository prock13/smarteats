import { meals, type Meal, type MacroInput, type MealSuggestion, type MealPlan, type InsertMealPlan } from "@shared/schema";

export interface IStorage {
  getMealSuggestions(input: MacroInput): Promise<MealSuggestion | undefined>;
  saveMealSuggestions(input: MacroInput, suggestions: any): Promise<MealSuggestion>;
  getMealPlans(startDate: Date, endDate: Date): Promise<MealPlan[]>;
  saveMealPlan(plan: InsertMealPlan): Promise<MealPlan>;
  deleteMealPlan(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private mealSuggestions: Map<string, MealSuggestion>;
  private mealPlans: Map<number, MealPlan>;
  private currentSuggestionId: number;
  private currentPlanId: number;

  constructor() {
    this.mealSuggestions = new Map();
    this.mealPlans = new Map();
    this.currentSuggestionId = 1;
    this.currentPlanId = 1;
  }

  private createKey(input: MacroInput): string {
    return `${input.targetCarbs}-${input.targetProtein}-${input.targetFats}-${input.mealCount}`;
  }

  async getMealSuggestions(input: MacroInput): Promise<MealSuggestion | undefined> {
    const key = this.createKey(input);
    return this.mealSuggestions.get(key);
  }

  async saveMealSuggestions(input: MacroInput, suggestions: any): Promise<MealSuggestion> {
    const key = this.createKey(input);
    const suggestion: MealSuggestion = {
      id: this.currentSuggestionId++,
      suggestions,
      targetCarbs: input.targetCarbs,
      targetProtein: input.targetProtein,
      targetFats: input.targetFats,
      mealCount: input.mealCount
    };
    this.mealSuggestions.set(key, suggestion);
    return suggestion;
  }

  async getMealPlans(startDate: Date, endDate: Date): Promise<MealPlan[]> {
    return Array.from(this.mealPlans.values()).filter(plan => {
      const planDate = new Date(plan.date);
      return planDate >= startDate && planDate <= endDate;
    });
  }

  async saveMealPlan(plan: InsertMealPlan): Promise<MealPlan> {
    const newPlan: MealPlan = {
      id: this.currentPlanId++,
      date: new Date(plan.date),
      meal: plan.meal,
      mealType: plan.mealType,
    };
    this.mealPlans.set(newPlan.id, newPlan);
    return newPlan;
  }

  async deleteMealPlan(id: number): Promise<void> {
    this.mealPlans.delete(id);
  }
}

export const storage = new MemStorage();