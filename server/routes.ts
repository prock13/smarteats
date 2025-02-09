import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMealSuggestions } from "./openai";
import OpenAI from "openai";
import { macroInputSchema, mealPlanSchema, insertRecipeSchema, insertFavoriteSchema } from "@shared/schema";
import { ZodError } from "zod";
import { setupAuth } from "./auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export function registerRoutes(app: Express): Server {
  const server = createServer(app);

  // Set up authentication routes and middleware first
  setupAuth(app);

  // Protected Routes - These require authentication
  app.post("/api/meal-suggestions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      console.log("Raw meal suggestions request body:", req.body);

      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ 
          message: "Invalid request body format - expected an object",
          received: typeof req.body
        });
      }

      const parseResult = macroInputSchema.safeParse(req.body);

      if (!parseResult.success) {
        console.error("Meal suggestions validation error:", parseResult.error);
        return res.status(400).json({ 
          message: "Validation failed",
          errors: parseResult.error.errors,
          received: req.body
        });
      }

      const input = parseResult.data;
      console.log("Parsed meal suggestions input:", JSON.stringify(input, null, 2));

      // Extract excludeRecipes safely
      const excludeRecipes = Array.isArray(req.body.excludeRecipes) ? req.body.excludeRecipes : [];

      console.log("Generating meal suggestions with input:", {
        ...input,
        excludeRecipes
      });

      const suggestions = await generateMealSuggestions(
        input.targetCarbs,
        input.targetProtein,
        input.targetFats,
        input.mealTypes,
        input.dietaryPreference,
        input.mealCount,
        excludeRecipes,
        input.includeUserRecipes
      );

      console.log("Generated suggestions:", JSON.stringify(suggestions, null, 2));
      res.json({ suggestions });
    } catch (error) {
      console.error("Error in meal suggestions endpoint:", error);

      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors,
          received: req.body
        });
      }

      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(500).json({ message });
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

      console.log('Fetching meal plans - Date range:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const plans = await storage.getMealPlans(startDate, endDate);
      console.log('Retrieved meal plans:', JSON.stringify(plans, null, 2));
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

      console.log('Received meal plan request:', JSON.stringify(req.body, null, 2));
      const plan = mealPlanSchema.parse(req.body);
      console.log('Parsed meal plan:', JSON.stringify(plan, null, 2));

      const saved = await storage.saveMealPlan({
        ...plan,
        userId: req.user!.id
      });

      console.log('Saved meal plan:', JSON.stringify(saved, null, 2));
      res.json(saved);
    } catch (error) {
      console.error('Error saving meal plan:', error);
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
  app.get("/api/recipes", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
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

      console.log("Recipe creation request body:", req.body);

      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ 
          message: "Invalid request body format",
          received: typeof req.body
        });
      }

      const parseResult = insertRecipeSchema.safeParse(req.body);

      if (!parseResult.success) {
        console.error("Recipe validation error:", parseResult.error);
        return res.status(400).json({ 
          message: "Validation failed",
          errors: parseResult.error.errors,
          received: req.body
        });
      }

      const recipe = parseResult.data;
      console.log("Validated recipe data:", recipe);

      const saved = await storage.saveRecipe(recipe);
      console.log("Recipe saved successfully:", saved);
      res.json(saved);
    } catch (error) {
      console.error("Error in recipe creation:", error);
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

      console.log("Getting favorites for user:", req.user!.id);
      const recipes = await storage.getFavorites(req.user!.id);
      console.log("Retrieved favorites:", recipes);
      res.json(recipes);
    } catch (error) {
      console.error("Error getting favorites:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const favorite = insertFavoriteSchema.omit({ userId: true }).parse(req.body);
      console.log("Adding favorite for user:", req.user!.id, "Recipe:", favorite);

      const savedFavorite = await storage.addFavorite(req.user!.id, favorite);
      console.log("Added favorite:", savedFavorite);
      res.json(savedFavorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.delete("/api/favorites/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const favoriteId = parseInt(req.params.id);
      if (isNaN(favoriteId)) {
        throw new Error("Invalid favorite ID");
      }

      console.log("Removing favorite - User:", req.user!.id, "FavoriteId:", favoriteId);
      await storage.removeFavorite(req.user!.id, favoriteId);
      console.log("Removed favorite");
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favorite:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.get("/api/favorites/check/:name", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const recipeName = req.params.name;
      const isFavorite = await storage.isFavorite(req.user!.id, recipeName);
      res.json({ isFavorite });
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.post("/api/user/password", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Both current and new passwords are required" });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await comparePasswords(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const hashedNewPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedNewPassword);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.post("/api/pantry-suggestions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      console.log("Received pantry request body:", req.body);

      const { carbSource, proteinSource, fatSource, mealType, dietaryPreference = "none", includeUserRecipes = false } = req.body;

      // Validate required fields
      if (!carbSource || !proteinSource || !fatSource || !mealType) {
        return res.status(400).json({
          message: "All ingredient sources and meal type are required"
        });
      }

      const excludeRecipes: string[] = [];

      console.log("Generating suggestions for pantry items:", {
        carbSource,
        proteinSource,
        fatSource,
        mealType,
        dietaryPreference
      });

      try {
        const suggestions = await generateMealSuggestions(
          0, // Not using specific macro targets for pantry suggestions
          0,
          0,
          [mealType],
          dietaryPreference,
          1,
          excludeRecipes,
          includeUserRecipes,
          { // Add pantry items as additional context
            carbSource,
            proteinSource,
            fatSource
          }
        );

        console.log("Generated suggestions from OpenAI:", JSON.stringify(suggestions, null, 2));
        res.json({ suggestions });
      } catch (error: any) {
        console.error("Error generating meal suggestions:", error);
        if (error instanceof ZodError) {
          return res.status(400).json({ message: error.errors });
        }
        throw error;
      }
    } catch (error: any) {
      console.error("Error in pantry suggestions:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });

  app.patch("/api/favorites/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const favoriteId = parseInt(req.params.id);
      if (isNaN(favoriteId)) {
        throw new Error("Invalid favorite ID");
      }

      const { tags } = req.body;
      if (!Array.isArray(tags)) {
        throw new Error("Tags must be an array of strings");
      }

      await storage.updateFavoriteTags(req.user!.id, favoriteId, tags);
      res.json({ message: "Tags updated successfully" });
    } catch (error) {
      console.error("Error updating favorite tags:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(400).json({ message });
    }
  });


  app.post("/api/chat", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { message, userPreferences } = req.body;
      console.log("Chat request received:", { message, userPreferences });

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are Chef Nina, a friendly and enthusiastic AI meal planning assistant. You have the following traits:
            - Passionate about healthy eating and balanced nutrition
            - Encouraging and supportive of users' dietary goals
            - Knowledgeable about various cuisines and cooking techniques
            - Considerate of dietary restrictions and preferences
            - Uses emojis occasionally to keep the conversation engaging
            - Provides practical, actionable meal suggestions`
          },
          {
            role: "user",
            content: `User preferences: ${JSON.stringify(userPreferences)}\n\nUser message: ${message}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const content = response.choices[0].message.content;
      console.log("Chat response generated:", content);

      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      res.json({ message: content });
    } catch (error) {
      console.error("Chat API error:", error);
      const message = error instanceof Error ? error.message : "Failed to generate response";
      res.status(500).json({ message });
    }
  });

  return server;
}