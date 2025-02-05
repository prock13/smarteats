import { users, meals, recipes, mealSuggestions, mealPlans, favorites, type User, type InsertUser, type Meal, type MacroInput, type MealSuggestion, type MealPlan, type Recipe, type InsertRecipe, type Favorite, type InsertFavorite } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: number, newPassword: string): Promise<void>; // Add password update method

  // Meal suggestion operations
  getMealSuggestions(input: MacroInput): Promise<MealSuggestion | undefined>;
  saveMealSuggestions(input: MacroInput, suggestions: any): Promise<MealSuggestion>;

  // Meal plan operations
  getMealPlans(startDate: Date, endDate: Date): Promise<MealPlan[]>;
  saveMealPlan(plan: MealPlan): Promise<MealPlan>;
  deleteMealPlan(id: number): Promise<void>;

  // Recipe operations
  getRecipes(): Promise<Recipe[]>;
  getRecipeById(id: number): Promise<Recipe | undefined>;
  saveRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: InsertRecipe): Promise<Recipe>;
  deleteRecipe(id: number): Promise<void>;

  // Favorite operations
  getFavorites(userId: number): Promise<Recipe[]>;
  addFavorite(userId: number, favorite: Omit<InsertFavorite, "userId">): Promise<Favorite>;
  removeFavorite(userId: number, favoriteId: number): Promise<void>;
  isFavorite(userId: number, recipeName: string): Promise<boolean>;
  updateFavoriteTags(userId: number, favoriteId: number, tags: string[]): Promise<void>;

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

  async saveMealPlan(plan: MealPlan): Promise<MealPlan> {
    console.log('Saving meal plan:', JSON.stringify(plan, null, 2));
    const [savedPlan] = await db
      .insert(mealPlans)
      .values({
        date: new Date(plan.date),
        meal: plan.meal,
        mealType: plan.mealType,
        userId: plan.userId
      })
      .returning();
    console.log('Saved meal plan:', JSON.stringify(savedPlan, null, 2));
    return savedPlan;
  }

  async deleteMealPlan(id: number): Promise<void> {
    await db
      .delete(mealPlans)
      .where(eq(mealPlans.id, id));
  }

  async getRecipes(): Promise<Recipe[]> {
    const recipesData = await db.select().from(recipes);
    return recipesData.map(recipe => ({
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      instructions: recipe.instructions,
      carbs: recipe.carbs,
      protein: recipe.protein,
      fats: recipe.fats,
      dietaryRestriction: recipe.dietaryRestriction || 'none',
      createdAt: recipe.createdAt,
      userId: recipe.userId
    }));
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

  async updateRecipe(id: number, recipe: InsertRecipe): Promise<Recipe> {
    const [updated] = await db
      .update(recipes)
      .set(recipe)
      .where(eq(recipes.id, id))
      .returning();
    return updated;
  }

  async deleteRecipe(id: number): Promise<void> {
    await db
      .delete(recipes)
      .where(eq(recipes.id, id));
  }

  async getFavorites(userId: number): Promise<Recipe[]> {
    console.log("Getting favorites for user:", userId);
    const result = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    console.log("Found favorites:", result);
    return result;
  }

  async addFavorite(userId: number, favorite: Omit<InsertFavorite, "userId">): Promise<Favorite> {
    console.log("Adding favorite for user:", userId, "recipe:", favorite);
    const [savedFavorite] = await db
      .insert(favorites)
      .values({ ...favorite, userId, tags: [] })
      .returning();
    console.log("Added favorite:", savedFavorite);
    return savedFavorite;
  }

  async removeFavorite(userId: number, favoriteId: number): Promise<void> {
    console.log("Removing favorite for user:", userId, "favoriteId:", favoriteId);
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.id, favoriteId)
        )
      );
  }

  async isFavorite(userId: number, recipeName: string): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.name, recipeName)
        )
      );
    return !!favorite;
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, userId));
  }
  async updateFavoriteTags(userId: number, favoriteId: number, tags: string[]): Promise<void> {
    console.log("Updating tags for favorite:", favoriteId, "new tags:", tags);
    await db
      .update(favorites)
      .set({ tags })
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.id, favoriteId)
        )
      );
  }
}

export const storage = new DatabaseStorage();