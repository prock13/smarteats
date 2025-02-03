import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMealSuggestions } from "./openai";
import { macroInputSchema, mealPlanSchema } from "@shared/schema";
import { ZodError } from "zod";

export function registerRoutes(app: Express): Server {
  app.post("/api/meal-suggestions", async (req, res) => {
    try {
      const input = macroInputSchema.parse(req.body);

      // Check cache first
      const cached = await storage.getMealSuggestions(input);
      if (cached) {
        return res.json(cached);
      }

      // Generate new suggestions
      const suggestions = await generateMealSuggestions(
        input.targetCarbs,
        input.targetProtein,
        input.targetFats,
        input.mealCount
      );

      // Cache and return results
      const saved = await storage.saveMealSuggestions(input, suggestions);
      res.json(saved);
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}