import { Router } from "express";
import { generateRecipe } from "../services/openai";
import { macroInputSchema, type MacroInput } from "@shared/schema";
import { storage } from "../storage";

const router = Router();

router.post("/api/pantry-suggestions", async (req, res) => {
  try {
    const input = macroInputSchema.parse(req.body);
    const { carbSource, proteinSource, fatSource, dietaryPreference } = input;

    const targetMacros = {
      carbs: input.targetCarbs,
      protein: input.targetProtein,
      fats: input.targetFats,
    };

    const recipe = await generateRecipe(
      { carbSource, proteinSource, fatSource },
      targetMacros,
      dietaryPreference
    );

    const suggestions = {
      meals: [
        {
          name: recipe.name,
          description: recipe.description,
          instructions: recipe.instructions,
          macros: recipe.macros,
          cookingTime: recipe.cookingTime,
          nutrients: recipe.nutrients,
          dietaryRestriction: recipe.dietaryRestriction,
          isStoredRecipe: false,
        },
      ],
    };

    res.json({ suggestions });
  } catch (error) {
    console.error("Error generating pantry suggestions:", error);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

export default router;
