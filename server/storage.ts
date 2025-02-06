import { users, recipes, mealPlans, favorites, type User, type InsertUser, type Recipe, type InsertRecipe, type MealPlan, type Favorite, type InsertFavorite } from "@shared/schema";
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
  updateUserPassword(userId: number, newPassword: string): Promise<void>;

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

  // Meal plan operations
  getMealPlans(startDate: Date, endDate: Date): Promise<MealPlan[]>;
  saveMealPlan(plan: MealPlan): Promise<MealPlan>;
  deleteMealPlan(id: number): Promise<void>;

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

  // User operations
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

  async updateUserPassword(userId: number, newPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, userId));
  }

  // Recipe operations
  async getRecipes(): Promise<Recipe[]> {
    return await db.select().from(recipes);
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
    await db.delete(recipes).where(eq(recipes.id, id));
  }

  // Favorite operations
  async getFavorites(userId: number): Promise<Recipe[]> {
    return await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
  }

  async addFavorite(userId: number, favorite: Omit<InsertFavorite, "userId">): Promise<Favorite> {
    const [saved] = await db
      .insert(favorites)
      .values({ ...favorite, userId, tags: [] })
      .returning();
    return saved;
  }

  async removeFavorite(userId: number, favoriteId: number): Promise<void> {
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

  async updateFavoriteTags(userId: number, favoriteId: number, tags: string[]): Promise<void> {
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

  // Meal plan operations
  async getMealPlans(startDate: Date, endDate: Date): Promise<MealPlan[]> {
    return await db
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
    const [saved] = await db
      .insert(mealPlans)
      .values(plan)
      .returning();
    return saved;
  }

  async deleteMealPlan(id: number): Promise<void> {
    await db.delete(mealPlans).where(eq(mealPlans.id, id));
  }
}

export const storage = new DatabaseStorage();