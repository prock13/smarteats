import { users, meals, recipes, mealSuggestions, mealPlans, favorites, type User, type InsertUser, type Meal, type MacroInput, type MealSuggestion, type MealPlan, type Recipe, type InsertRecipe, type Favorite, type InsertFavorite } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: number, newPassword: string): Promise<void>;

  // Meal suggestion operations
  getMealSuggestions(input: MacroInput): Promise<MealSuggestion | undefined>;
  saveMealSuggestions(input: MacroInput, suggestions: any): Promise<MealSuggestion>;

  // Meal plan operations
  getMealPlans(startDate: Date, endDate: Date): Promise<MealPlan[]>;
  saveMealPlan(plan: MealPlan & { meal: { name: string; description: string; instructions?: string; servingSize?: string | null; carbs: number; protein: number; fats: number; calories?: number | null; fiber?: number | null; sugar?: number | null; cholesterol?: number | null; sodium?: number | null; cookingTime?: any; nutrients?: any; dietaryRestriction?: string; macros?: { calories?: number | null; fiber?: number | null; sugar?: number | null; cholesterol?: number | null; sodium?: number | null; } ; ingredients?: string[] } }): Promise<MealPlan>;
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

  // Add new methods for user profile
  updateUserProfile(userId: number, profile: Partial<User>): Promise<User>;
  updateUserProfilePicture(userId: number, pictureUrl: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Configure session store with error handling and retries
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      schemaName: 'public',
      tableName: 'session',
      pruneSessionInterval: false, // Disable automatic pruning
      errorLog: console.error.bind(console),
    });

    // Log session store initialization
    console.log('Session store initialized with PostgreSQL');
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
    console.log('Getting meal plans between:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const plans = await db
      .select()
      .from(mealPlans)
      .where(
        and(
          gte(mealPlans.date, startDate),
          lte(mealPlans.date, endDate)
        )
      );

    // Ensure ingredients are included in the response
    const plansWithIngredients = plans.map(plan => {
      const mealData = plan.meal as any;
      if (!Array.isArray(mealData.ingredients)) {
        console.log('Raw ingredients data:', mealData.ingredients);
      }
      return {
        ...plan,
        meal: {
          ...mealData,
          ingredients: Array.isArray(mealData.ingredients) ? mealData.ingredients : []
        }
      };
    });

    console.log('Retrieved meal plans:', JSON.stringify(plansWithIngredients, null, 2));
    return plansWithIngredients;
  }

  async saveMealPlan(plan: MealPlan & { meal: { name: string; description: string; instructions?: string; servingSize?: string | null; carbs: number; protein: number; fats: number; calories?: number | null; fiber?: number | null; sugar?: number | null; cholesterol?: number | null; sodium?: number | null; cookingTime?: any; nutrients?: any; dietaryRestriction?: string; macros?: { calories?: number | null; fiber?: number | null; sugar?: number | null; cholesterol?: number | null; sodium?: number | null; }; ingredients?: string[]; } }): Promise<MealPlan> {
    console.log('Saving meal plan:', JSON.stringify(plan, null, 2));

    const ingredients = Array.isArray(plan.meal.ingredients) ? plan.meal.ingredients : [];
    console.log('Raw meal ingredients:', plan.meal.ingredients);
    console.log('Processed ingredients to save:', ingredients);

    const meal = {
      name: plan.meal.name,
      description: plan.meal.description,
      instructions: plan.meal.instructions || '',
      servingSize: plan.meal.servingSize || null,
      macros: {
        carbs: plan.meal.carbs,
        protein: plan.meal.protein,
        fats: plan.meal.fats,
        calories: plan.meal.macros?.calories || plan.meal.calories || null,
        fiber: plan.meal.macros?.fiber || plan.meal.fiber || null,
        sugar: plan.meal.macros?.sugar || plan.meal.sugar || null,
        cholesterol: plan.meal.macros?.cholesterol || plan.meal.cholesterol || null,
        sodium: plan.meal.macros?.sodium || plan.meal.sodium || null,
      },
      cookingTime: plan.meal.cookingTime || null,
      nutrients: plan.meal.nutrients || { vitamins: null, minerals: null },
      dietaryRestriction: plan.meal.dietaryRestriction || "none",
      ingredients: plan.meal.ingredients || []
    };

    const [savedPlan] = await db
      .insert(mealPlans)
      .values({
        date: plan.date,
        meal,
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
    return recipesData;
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

    const favoritesWithFullData = result.map(favorite => ({
      ...favorite,
      servingSize: favorite.servingSize ?? null,
      cookingTime: favorite.cookingTime ?? null,
      nutrients: favorite.nutrients ?? { vitamins: null, minerals: null },
      dietaryRestriction: favorite.dietaryRestriction ?? "none"
    }));

    console.log("Found favorites:", favoritesWithFullData);
    return favoritesWithFullData;
  }

  async addFavorite(userId: number, favorite: Omit<InsertFavorite, "userId">): Promise<Favorite> {
    console.log("Adding favorite for user:", userId, "recipe:", favorite);
    const [savedFavorite] = await db
      .insert(favorites)
      .values({
        ...favorite,
        userId,
        servingSize: favorite.servingSize || null,
        tags: favorite.tags || []
      })
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

  async updateUserProfile(userId: number, profile: Partial<User>): Promise<User> {
    console.log('Updating user profile:', userId, JSON.stringify(profile, null, 2));
    const [updated] = await db
      .update(users)
      .set(profile)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserProfilePicture(userId: number, pictureUrl: string): Promise<void> {
    console.log('Updating user profile picture:', userId, pictureUrl);
    await db
      .update(users)
      .set({ profilePicture: pictureUrl })
      .where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();