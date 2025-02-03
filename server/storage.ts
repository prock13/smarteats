import { meals, type Meal, type MacroInput, type MealSuggestion } from "@shared/schema";

export interface IStorage {
  getMealSuggestions(input: MacroInput): Promise<MealSuggestion | undefined>;
  saveMealSuggestions(input: MacroInput, suggestions: any): Promise<MealSuggestion>;
}

export class MemStorage implements IStorage {
  private mealSuggestions: Map<string, MealSuggestion>;
  private currentId: number;

  constructor() {
    this.mealSuggestions = new Map();
    this.currentId = 1;
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
      id: this.currentId++,
      suggestions,
      targetCarbs: input.targetCarbs,
      targetProtein: input.targetProtein,
      targetFats: input.targetFats,
      mealCount: input.mealCount
    };
    this.mealSuggestions.set(key, suggestion);
    return suggestion;
  }
}

export const storage = new MemStorage();
