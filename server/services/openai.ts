import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface RecipeMacros {
  carbs: number;
  protein: number;
  fats: number;
  calories: number;
  fiber: number;
  sugar: number;
}

interface RecipeNutrients {
  vitamins?: string[];
  minerals?: string[];
}

interface RecipeCookingTime {
  prep: number;
  cook: number;
  total: number;
}

interface GeneratedRecipe {
  name: string;
  description: string;
  instructions: string;
  macros: RecipeMacros;
  cookingTime: RecipeCookingTime;
  nutrients: RecipeNutrients;
  dietaryRestriction: string;
}

export async function generateRecipe(
  ingredients: { carbSource: string; proteinSource: string; fatSource: string },
  targetMacros: { carbs: number; protein: number; fats: number },
  dietaryPreference: string
): Promise<GeneratedRecipe> {
  const prompt = `Create a healthy recipe using these ingredients:
- Carb source: ${ingredients.carbSource}
- Protein source: ${ingredients.proteinSource}
- Fat source: ${ingredients.fatSource}

Target macronutrients:
- Carbs: ${targetMacros.carbs}g
- Protein: ${targetMacros.protein}g
- Fats: ${targetMacros.fats}g

Dietary preference: ${dietaryPreference}

Provide the recipe details in this exact JSON format:
{
  "name": "Recipe name",
  "description": "Brief description",
  "instructions": "Detailed step-by-step instructions",
  "macros": {
    "carbs": number,
    "protein": number,
    "fats": number,
    "calories": number,
    "fiber": number,
    "sugar": number
  },
  "cookingTime": {
    "prep": number (in minutes),
    "cook": number (in minutes),
    "total": number (in minutes)
  },
  "nutrients": {
    "vitamins": ["list of main vitamins"],
    "minerals": ["list of main minerals"]
  },
  "dietaryRestriction": "${dietaryPreference}"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a professional nutritionist and chef. Create recipes that match the given ingredients and nutritional requirements. Always include detailed nutritional information and cooking instructions.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const recipe = JSON.parse(response.choices[0].message.content);
    return recipe;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate recipe");
  }
}
