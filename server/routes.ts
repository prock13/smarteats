import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMealSuggestions } from "./openai";
import { macroInputSchema, mealPlanSchema, insertRecipeSchema } from "@shared/schema";
import { ZodError } from "zod";

export function registerRoutes(app: Express): Server {
  app.post("/api/meal-suggestions", async (req, res) => {
    try {
      console.log("Received meal suggestions request:", JSON.stringify(req.body, null, 2));
      const input = macroInputSchema.parse(req.body);
      console.log("Parsed input:", JSON.stringify(input, null, 2));

      // Check cache first
      const cached = await storage.getMealSuggestions(input);
      if (cached) {
        console.log("Returning cached suggestions:", JSON.stringify(cached, null, 2));
        return res.json(cached);
      }

      // Generate new suggestions
      console.log("Generating new suggestions");
      const suggestions = await generateMealSuggestions(
        input.targetCarbs,
        input.targetProtein,
        input.targetFats,
        input.mealTypes,
        input.dietaryPreference,
        input.recipeLimit
      );

      console.log("Generated suggestions:", JSON.stringify(suggestions, null, 2));

      // Cache and return results
      const saved = await storage.saveMealSuggestions(input, suggestions);
      console.log("Saved and returning suggestions:", JSON.stringify(saved, null, 2));
      res.json(saved);
    } catch (error) {
      console.error("Error in meal suggestions:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.get("/api/meal-plans", async (req, res) => {
    try {
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date format");
      }

      const plans = await storage.getMealPlans(startDate, endDate);
      res.json(plans);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.post("/api/meal-plans", async (req, res) => {
    try {
      const plan = mealPlanSchema.parse(req.body);
      const saved = await storage.saveMealPlan(plan);
      res.json(saved);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.delete("/api/meal-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new Error("Invalid meal plan ID");
      }
      await storage.deleteMealPlan(id);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  // Recipe routes
  app.get("/api/recipes", async (_req, res) => {
    try {
      const recipes = await storage.getRecipes();
      res.json(recipes);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new Error("Invalid recipe ID");
      }
      const recipe = await storage.getRecipeById(id);
      if (!recipe) {
        res.status(404).json({ message: "Recipe not found" });
        return;
      }
      res.json(recipe);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.post("/api/recipes", async (req, res) => {
    try {
      const recipe = insertRecipeSchema.parse(req.body);
      const saved = await storage.saveRecipe(recipe);
      res.json(saved);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new Error("Invalid recipe ID");
      }
      await storage.deleteRecipe(id);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}