import { Router } from "express";
import { generateRecipe, generateIngredientSubstitutions } from "../services/openai";
import { z } from "zod";
import { macroInputSchema, dietaryPreferenceEnum } from "@shared/schema";
import { storage } from "../storage";

const router = Router();

router.post("/api/pantry-suggestions", async (req, res) => {
  try {
    const input = macroInputSchema.parse(req.body);

    const suggestions = await generateRecipe({
      targetCarbs: input.targetCarbs,
      targetProtein: input.targetProtein,
      targetFats: input.targetFats,
      dietaryPreference: input.dietaryPreference
    });

    res.json({ suggestions });
  } catch (error) {
    console.error("Error generating pantry suggestions:", error);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

const substitutionRequestSchema = z.object({
  ingredient: z.string().min(1, "Ingredient is required"),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  dietaryPreferences: z.array(dietaryPreferenceEnum).default(["none"])
});

router.post("/api/ingredient-substitutes", async (req, res) => {
  try {
    const input = substitutionRequestSchema.parse(req.body);

    const substitutes = await generateIngredientSubstitutions({
      ingredient: input.ingredient,
      dietaryPreferences: input.dietaryPreferences,
      quantity: input.quantity,
      unit: input.unit
    });

    res.json(substitutes);
  } catch (error) {
    console.error("Error generating ingredient substitutes:", error);
    res.status(500).json({ error: "Failed to generate substitutes" });
  }
});

export default router;