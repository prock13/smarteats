import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMealSuggestions } from "./openai";
import { macroInputSchema } from "@shared/schema";

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
      res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
