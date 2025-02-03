import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
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

export const macroInputSchema = z.object({
  targetCarbs: z.number().min(0).max(1000),
  targetProtein: z.number().min(0).max(1000),
  targetFats: z.number().min(0).max(1000),
  mealCount: z.number().min(1).max(10),
});

export type MacroInput = z.infer<typeof macroInputSchema>;
export type Meal = typeof meals.$inferSelect;
export type MealSuggestion = typeof mealSuggestions.$inferSelect;
