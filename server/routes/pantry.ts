import { Router } from "express";
import { generateRecipe } from "../services/openai";
import { macroInputSchema, type MacroInput } from "@shared/schema";
import { storage } from "../storage";

const router = Router();

router.post("/api/pantry-suggestions", async (req, res) => {
  try {
    const input = macroInputSchema.parse(req.body);

    const recipe = await generateRecipe({
      targetCarbs: input.targetCarbs,
      targetProtein: input.targetProtein,
      targetFats: input.targetFats,
      dietaryPreference: input.dietaryPreference
    });

    const suggestions = {
      meals: [
        {
          name: recipe.name,
          description: recipe.description,
          instructions: recipe.instructions,
          macros: {
            carbs: recipe.carbs,
            protein: recipe.protein,
            fats: recipe.fats
          },
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