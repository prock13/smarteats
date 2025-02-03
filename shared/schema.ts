import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  carbs: integer("carbs").notNull(),
  protein: integer("protein").notNull(),
  fats: integer("fats").notNull(),
  description: text("description").notNull(),
});

export const mealSuggestions = pgTable("meal_suggestions", {
  id: serial("id").primaryKey(),
  suggestions: jsonb("suggestions").notNull(),
  targetCarbs: integer("target_carbs").notNull(),
  targetProtein: integer("target_protein").notNull(),
  targetFats: integer("target_fats").notNull(),
  mealCount: integer("meal_count").notNull(),
});

export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  meal: jsonb("meal").notNull(), // Store the meal data
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
});

export const macroInputSchema = z.object({
  targetCarbs: z.number().min(0).max(1000),
  targetProtein: z.number().min(0).max(1000),
  targetFats: z.number().min(0).max(1000),
  mealCount: z.number().min(1).max(10),
});

export const mealPlanSchema = z.object({
  date: z.string(), // ISO date string
  meal: z.object({
    name: z.string(),
    description: z.string(),
    macros: z.object({
      carbs: z.number(),
      protein: z.number(),
      fats: z.number(),
    }),
  }),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
});

export type MacroInput = z.infer<typeof macroInputSchema>;
export type Meal = typeof meals.$inferSelect;
export type MealSuggestion = typeof mealSuggestions.$inferSelect;
export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof mealPlanSchema>;