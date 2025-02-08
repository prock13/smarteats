import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  carbs: integer("carbs").notNull(),
  protein: integer("protein").notNull(),
  fats: integer("fats").notNull(),
  description: text("description").notNull(),
  userId: integer("user_id").references(() => users.id),
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
  servingSize: text("serving_size"),  
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

export const mealSuggestions = pgTable("meal_suggestions", {
  id: serial("id").primaryKey(),
  suggestions: jsonb("suggestions").notNull(),
  targetCarbs: integer("target_carbs").notNull(),
  targetProtein: integer("target_protein").notNull(),
  targetFats: integer("target_fats").notNull(),
  mealCount: integer("meal_count").notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  meal: jsonb("meal").notNull(),
  mealType: text("meal_type").notNull(),
  userId: integer("user_id").references(() => users.id),
});

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

export const macroInputSchema = z.object({
  targetCarbs: z.number().min(0).max(1000),
  targetProtein: z.number().min(0).max(1000),
  targetFats: z.number().min(0).max(1000),
  mealCount: z.number().min(1).max(10),
  dietaryPreference: dietaryPreferenceEnum.default("none"),
  mealTypes: z.array(mealTypeEnum).min(1, "Select at least one meal type"),
  includeUserRecipes: z.boolean().default(false)
});

export const cookingTimeSchema = z.object({
  prep: z.number().nullable(),
  cook: z.number().nullable(),
  total: z.number().nullable(),
});

export const nutrientsSchema = z.object({
  vitamins: z.array(z.string()).nullable(),
  minerals: z.array(z.string()).nullable(),
});

export const insertRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().min(1, "Description is required"),
  instructions: z.string().min(1, "Instructions are required"),
  carbs: z.number().min(0, "Carbs must be 0 or greater"),
  protein: z.number().min(0, "Protein must be 0 or greater"),
  fats: z.number().min(0, "Fats must be 0 or greater"),
  calories: z.number().nullable(),
  servingSize: z.string().nullable(),
  fiber: z.number().nullable(),
  sugar: z.number().nullable(),
  cholesterol: z.number().nullable(),
  sodium: z.number().nullable(),
  cookingTime: cookingTimeSchema.nullable(),
  nutrients: nutrientsSchema.nullable(),
  dietaryRestriction: dietaryPreferenceEnum.default("none"),
});

export const mealPlanSchema = z.object({
  date: z.string().transform(str => {
    const date = new Date(str);
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12, 0, 0, 0
    ));
  }),
  meal: z.object({
    name: z.string(),
    description: z.string(),
    instructions: z.string().optional(),
    servingSize: z.string().nullable(),
    macros: z.object({
      carbs: z.number(),
      protein: z.number(),
      fats: z.number(),
      calories: z.number().nullable(),
      fiber: z.number().nullable(),
      sugar: z.number().nullable(),
      cholesterol: z.number().nullable(),
      sodium: z.number().nullable(),
    }),
    cookingTime: cookingTimeSchema.nullable(),
    nutrients: nutrientsSchema.nullable(),
    dietaryRestriction: dietaryPreferenceEnum.default("none"),
  }),
  mealType: mealTypeEnum,
});

export const insertUserSchema = createInsertSchema(users).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
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
export type MacroInput = z.infer<typeof macroInputSchema>;
export type Meal = typeof meals.$inferSelect;
export type Recipe = typeof recipes.$inferSelect & { servingSize: string | null };
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type MealSuggestion = typeof mealSuggestions.$inferSelect;
export type MealPlan = typeof mealPlans.$inferSelect;
export type DietaryPreference = z.infer<typeof dietaryPreferenceEnum>;
export type MealType = z.infer<typeof mealTypeEnum>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;