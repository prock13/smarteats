import { pgTable, text, serial, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions").notNull(),
  carbs: integer("carbs").notNull(),
  protein: integer("protein").notNull(),
  fats: integer("fats").notNull(),
  calories: integer("calories"),
  fiber: integer("fiber"),
  sugar: integer("sugar"),
  cholesterol: integer("cholesterol"),
  sodium: integer("sodium"),
  cookingTime: jsonb("cooking_time"),
  nutrients: jsonb("nutrients"),
  dietaryRestriction: text("dietary_restriction").default("none").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions").notNull(),
  carbs: integer("carbs").notNull(),
  protein: integer("protein").notNull(),
  fats: integer("fats").notNull(),
  calories: integer("calories"),
  fiber: integer("fiber"),
  sugar: integer("sugar"),
  cholesterol: integer("cholesterol"),
  sodium: integer("sodium"),
  cookingTime: jsonb("cooking_time"),
  nutrients: jsonb("nutrients"),
  dietaryRestriction: text("dietary_restriction").default("none").notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  meal: jsonb("meal").notNull(),
  mealType: text("meal_type").notNull(),
  userId: integer("user_id").references(() => users.id),
});

// Schema validation
export const dietaryPreferenceEnum = z.enum([
  "none",
  "vegetarian",
  "vegan",
  "pescatarian",
  "keto",
  "paleo",
  "gluten-free",
  "dairy-free",
  "halal",
  "kosher"
]);

export const mealTypeEnum = z.enum(["breakfast", "lunch", "dinner", "snack"]);

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

export const insertRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().min(1, "Description is required"),
  instructions: z.string().min(1, "Instructions are required"),
  carbs: z.number().min(0, "Carbs must be 0 or greater"),
  protein: z.number().min(0, "Protein must be 0 or greater"),
  fats: z.number().min(0, "Fats must be 0 or greater"),
  calories: z.number().nullable(),
  fiber: z.number().nullable(),
  sugar: z.number().nullable(),
  cholesterol: z.number().nullable(),
  sodium: z.number().nullable(),
  cookingTime: z.object({
    prep: z.number().nullable(),
    cook: z.number().nullable(),
    total: z.number().nullable(),
  }).nullable(),
  nutrients: z.object({
    vitamins: z.array(z.string()).nullable(),
    minerals: z.array(z.string()).nullable(),
  }).nullable(),
  dietaryRestriction: dietaryPreferenceEnum.default("none"),
});

export const insertFavoriteSchema = createInsertSchema(favorites).extend({
  userId: z.number(),
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().min(1, "Description is required"),
  instructions: z.string().min(1, "Instructions are required"),
  carbs: z.number().min(0, "Carbs must be 0 or greater"),
  protein: z.number().min(0, "Protein must be 0 or greater"),
  fats: z.number().min(0, "Fats must be 0 or greater"),
  dietaryRestriction: dietaryPreferenceEnum.default("none"),
  tags: z.array(z.string()).optional().default([]),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;