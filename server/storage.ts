import { meals, recipes, mealSuggestions, mealPlans, type Meal, type MacroInput, type MealSuggestion, type MealPlan, type InsertMealPlan, type Recipe, type InsertRecipe } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  getMealSuggestions(input: MacroInput): Promise<MealSuggestion | undefined>;
  saveMealSuggestions(input: MacroInput, suggestions: any): Promise<MealSuggestion>;
  getMealPlans(startDate: Date, endDate: Date): Promise<MealPlan[]>;
  saveMealPlan(plan: InsertMealPlan): Promise<MealPlan>;
  deleteMealPlan(id: number): Promise<void>;
  getRecipes(): Promise<Recipe[]>;
  getRecipeById(id: number): Promise<Recipe | undefined>;
  saveRecipe(recipe: InsertRecipe): Promise<Recipe>;
  deleteRecipe(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private createKey(input: MacroInput): string {
    return `${input.targetCarbs}-${input.targetProtein}-${input.targetFats}-${input.mealCount}`;
  }

  async getMealSuggestions(input: MacroInput): Promise<MealSuggestion | undefined> {
    const key = this.createKey(input);
    const [suggestion] = await db
      .select()
      .from(mealSuggestions)
      .where(
        and(
          eq(mealSuggestions.targetCarbs, input.targetCarbs),
          eq(mealSuggestions.targetProtein, input.targetProtein),
          eq(mealSuggestions.targetFats, input.targetFats),
          eq(mealSuggestions.mealCount, input.mealCount)
        )
      );
    return suggestion;
  }

  async saveMealSuggestions(input: MacroInput, suggestions: any): Promise<MealSuggestion> {
    const [suggestion] = await db
      .insert(mealSuggestions)
      .values({
        suggestions,
        targetCarbs: input.targetCarbs,
        targetProtein: input.targetProtein,
        targetFats: input.targetFats,
        mealCount: input.mealCount
      })
      .returning();
    return suggestion;
  }

  async getMealPlans(startDate: Date, endDate: Date): Promise<MealPlan[]> {
    return db
      .select()
      .from(mealPlans)
      .where(
        and(
          gte(mealPlans.date, startDate),
          lte(mealPlans.date, endDate)
        )
      );
  }

  async saveMealPlan(plan: InsertMealPlan): Promise<MealPlan> {
    const [savedPlan] = await db
      .insert(mealPlans)
      .values({
        date: new Date(plan.date),
        meal: plan.meal,
        mealType: plan.mealType
      })
      .returning();
    return savedPlan;
  }

  async deleteMealPlan(id: number): Promise<void> {
    await db
      .delete(mealPlans)
      .where(eq(mealPlans.id, id));
  }

  async getRecipes(): Promise<Recipe[]> {
    return db.select().from(recipes);
  }

  async getRecipeById(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id));
    return recipe;
  }

  async saveRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [saved] = await db
      .insert(recipes)
      .values(recipe)
      .returning();
    return saved;
  }

  async deleteRecipe(id: number): Promise<void> {
    await db
      .delete(recipes)
      .where(eq(recipes.id, id));
  }
}

export const storage = new DatabaseStorage();