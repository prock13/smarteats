import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMealSuggestions } from "./openai";
import { macroInputSchema, mealPlanSchema, insertRecipeSchema } from "@shared/schema";
import { setupAuth } from "./auth";

export function registerRoutes(app: Express): Server {
  // Set up authentication routes and middleware
  setupAuth(app);

  app.post("/api/meal-suggestions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      console.log("Received meal suggestions request:", JSON.stringify(req.body, null, 2));

      const input = macroInputSchema.parse(req.body);
      console.log("Parsed input:", JSON.stringify(input, null, 2));

      const excludeRecipes = req.body.excludeRecipes || [];

      // Generate fresh suggestions every time - no caching
      console.log("Generating new suggestions via OpenAI");
      const suggestions = await generateMealSuggestions(
        input.targetCarbs,
        input.targetProtein,
        input.targetFats,
        input.mealTypes,
        input.dietaryPreference,
        input.recipeLimit,
        excludeRecipes
      );

      console.log("Generated suggestions from OpenAI:", JSON.stringify(suggestions, null, 2));
      res.json({ suggestions });
    } catch (error) {
      console.error("Error in meal suggestions:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.get("/api/meal-plans", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

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
      if (!_req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const recipes = await storage.getRecipes();
      res.json(recipes);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const recipe = insertRecipeSchema.parse(req.body);
      const saved = await storage.saveRecipe(recipe);
      res.json(saved);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.put("/api/recipes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new Error("Invalid recipe ID");
      }

      const existing = await storage.getRecipeById(id);
      if (!existing) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      const recipe = insertRecipeSchema.parse(req.body);
      const updated = await storage.updateRecipe(id, recipe);
      res.json(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

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

  // Add favorite routes
  app.get("/api/favorites", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const recipes = await storage.getFavorites(req.user!.id);
      res.json(recipes);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.post("/api/favorites/:recipeId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const recipeId = parseInt(req.params.recipeId);
      if (isNaN(recipeId)) {
        throw new Error("Invalid recipe ID");
      }

      const recipe = await storage.getRecipeById(recipeId);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      const favorite = await storage.addFavorite(req.user!.id, recipeId);
      res.json(favorite);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.delete("/api/favorites/:recipeId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const recipeId = parseInt(req.params.recipeId);
      if (isNaN(recipeId)) {
        throw new Error("Invalid recipe ID");
      }

      await storage.removeFavorite(req.user!.id, recipeId);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.get("/api/favorites/:recipeId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const recipeId = parseInt(req.params.recipeId);
      if (isNaN(recipeId)) {
        throw new Error("Invalid recipe ID");
      }

      const isFavorite = await storage.isFavorite(req.user!.id, recipeId);
      res.json({ isFavorite });
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}