import { users, meals, recipes, mealSuggestions, mealPlans, type User, type InsertUser, type Meal, type MacroInput, type MealSuggestion, type MealPlan, type InsertMealPlan, type Recipe, type InsertRecipe } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Meal suggestion operations
  getMealSuggestions(input: MacroInput): Promise<MealSuggestion | undefined>;
  saveMealSuggestions(input: MacroInput, suggestions: any): Promise<MealSuggestion>;

  // Meal plan operations
  getMealPlans(startDate: Date, endDate: Date): Promise<MealPlan[]>;
  saveMealPlan(plan: InsertMealPlan): Promise<MealPlan>;
  deleteMealPlan(id: number): Promise<void>;

  // Recipe operations
  getRecipes(): Promise<Recipe[]>;
  getRecipeById(id: number): Promise<Recipe | undefined>;
  saveRecipe(recipe: InsertRecipe): Promise<Recipe>;
  deleteRecipe(id: number): Promise<void>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  private createKey(input: MacroInput): string {
    return `${input.targetCarbs}-${input.targetProtein}-${input.targetFats}-${input.mealTypes.join(',')}-${input.dietaryPreference}`;
  }

  async getMealSuggestions(input: MacroInput): Promise<MealSuggestion | undefined> {
    const [suggestion] = await db
      .select()
      .from(mealSuggestions)
      .where(
        and(
          eq(mealSuggestions.targetCarbs, input.targetCarbs),
          eq(mealSuggestions.targetProtein, input.targetProtein),
          eq(mealSuggestions.targetFats, input.targetFats),
          eq(mealSuggestions.mealCount, input.mealTypes.length)
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
        mealCount: input.mealTypes.length
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