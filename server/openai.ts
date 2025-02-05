import OpenAI from "openai";
import { storage } from "./storage";
import type { Recipe } from "@shared/schema";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simple rate limiting mechanism
const requestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3; // Maximum 3 requests per minute
const API_TIMEOUT = 60000; // 60 second timeout

function checkRateLimit() {
  const now = Date.now();
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestRequest = requestTimestamps[0];
    const timeToWait = Math.ceil((oldestRequest + RATE_LIMIT_WINDOW - now) / 1000);
    throw new Error(`Rate limit exceeded. Please wait ${timeToWait} seconds before trying again.`);
  }

  requestTimestamps.push(now);
}

export async function generateRecipe({
  targetCarbs,
  targetProtein,
  targetFats,
  dietaryPreference
}: {
  targetCarbs: number;
  targetProtein: number;
  targetFats: number;
  dietaryPreference: string;
}) {
  try {
    checkRateLimit();

    const prompt = `Create a recipe that matches these macro targets:
- Carbohydrates: ${targetCarbs}g
- Protein: ${targetProtein}g
- Fats: ${targetFats}g
${dietaryPreference !== "none" ? `\nDietary Restriction: ${dietaryPreference}` : ''}

Format your response as a JSON object with this exact structure:
{
  "name": "Recipe name",
  "description": "Brief description",
  "instructions": "Step-by-step instructions",
  "macros": {
    "carbs": number,
    "protein": number,
    "fats": number,
    "calories": number,
    "fiber": number,
    "sugar": number,
    "cholesterol": number,
    "sodium": number
  },
  "cookingTime": {
    "prep": number,
    "cook": number,
    "total": number
  },
  "nutrients": {
    "vitamins": string[],
    "minerals": string[]
  }
}

Include detailed nutritional information and cooking time. If you're unsure about any value, use null.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional nutritionist and chef. Create detailed recipes with precise macro ratios and complete nutritional information. Always provide measurements in grams for macros and milligrams for micronutrients."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const parsedContent = JSON.parse(content);
    return {
      name: parsedContent.name,
      description: parsedContent.description,
      instructions: parsedContent.instructions,
      carbs: parsedContent.macros.carbs,
      protein: parsedContent.macros.protein,
      fats: parsedContent.macros.fats,
      calories: parsedContent.macros.calories,
      fiber: parsedContent.macros.fiber,
      sugar: parsedContent.macros.sugar,
      cholesterol: parsedContent.macros.cholesterol,
      sodium: parsedContent.macros.sodium,
      cookingTime: parsedContent.cookingTime,
      nutrients: parsedContent.nutrients,
      dietaryRestriction: dietaryPreference
    };
  } catch (error: any) {
    console.error("Error in generateRecipe:", error);
    throw error;
  }
}

export async function generateMealSuggestions(
  carbs: number,
  protein: number,
  fats: number,
  mealTypes: string[],
  dietaryPreference: string = "none",
  recipeLimit?: number,
  excludeRecipes: string[] = [],
  includeUserRecipes: boolean = false,
  pantryItems?: {
    carbSource?: string;
    proteinSource?: string;
    fatSource?: string;
  }
) {
  try {
    checkRateLimit();

    let prompt: string;
    let systemRole: string;
    let matchingStoredRecipes: Recipe[] = [];

    // If includeUserRecipes is true, get matching stored recipes first
    if (includeUserRecipes) {
      const storedRecipes = await storage.getRecipes();
      matchingStoredRecipes = storedRecipes.filter(recipe => {
        if (excludeRecipes.includes(recipe.name)) return false;
        if (dietaryPreference !== "none" && recipe.dietaryRestriction !== dietaryPreference) return false;

        // Basic macro matching (within 20% tolerance)
        const carbMatch = Math.abs(recipe.carbs - carbs) <= carbs * 0.2;
        const proteinMatch = Math.abs(recipe.protein - protein) <= protein * 0.2;
        const fatMatch = Math.abs(recipe.fats - fats) <= fats * 0.2;

        return carbMatch && proteinMatch && fatMatch;
      });
    }

    if (pantryItems) {
      prompt = `Create a recipe using these ingredients:
- Main carb: ${pantryItems.carbSource}
- Main protein: ${pantryItems.proteinSource}
- Main fat: ${pantryItems.fatSource}

The recipe should be suitable for: ${mealTypes[0]}
Dietary preference: ${dietaryPreference}

Format your response as a JSON object with this exact structure:
{
  "meals": [
    {
      "name": "Recipe name",
      "description": "Brief description",
      "instructions": "Step-by-step instructions",
      "macros": {
        "carbs": number,
        "protein": number,
        "fats": number,
        "calories": number,
        "fiber": number,
        "sugar": number,
        "cholesterol": number,
        "sodium": number
      },
      "cookingTime": {
        "prep": number,
        "cook": number,
        "total": number
      },
      "nutrients": {
        "vitamins": string[],
        "minerals": string[]
      }
    }
  ]
}`;
      systemRole = "You are a professional nutritionist and chef. Create detailed recipes with precise macro ratios and complete nutritional information. Keep your response in valid JSON format. Do not combine or modify existing recipes.";
    } else {
      // Calculate how many AI recipes to generate
      const totalDesiredMeals = recipeLimit || 1;
      const aiRecipesToGenerate = Math.max(1, totalDesiredMeals - matchingStoredRecipes.length);

      prompt = `Create ${aiRecipesToGenerate} meal suggestion${aiRecipesToGenerate > 1 ? 's' : ''} matching these macro targets:
- Carbohydrates: ${carbs}g
- Protein: ${protein}g
- Fats: ${fats}g

${excludeRecipes.length > 0 ? `\nDo not suggest these recipes: ${excludeRecipes.join(', ')}` : ''}
${dietaryPreference !== "none" ? `\nDietary Restriction: ${dietaryPreference}` : ''}
${mealTypes.length > 0 ? `\nMeal types: ${mealTypes.join(', ')}` : ''}

Format your response as a JSON object with this exact structure:
{
  "meals": [
    {
      "name": "Recipe name",
      "description": "Brief description",
      "instructions": "Step-by-step instructions",
      "macros": {
        "carbs": number,
        "protein": number,
        "fats": number,
        "calories": number,
        "fiber": number,
        "sugar": number,
        "cholesterol": number,
        "sodium": number
      },
      "cookingTime": {
        "prep": number,
        "cook": number,
        "total": number
      },
      "nutrients": {
        "vitamins": string[],
        "minerals": string[]
      },
      "isStoredRecipe": false
    }
  ]
}`;
      systemRole = "You are a nutrition expert. Create recipes with precise macro ratios and complete nutritional information. Always respond with valid JSON format. Create completely new recipes.";
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemRole
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const parsedContent = JSON.parse(content);

    if (!parsedContent.meals || !Array.isArray(parsedContent.meals)) {
      throw new Error("Invalid response format: missing or invalid meals array");
    }

    // If we have matching stored recipes, add them to the suggestions
    if (matchingStoredRecipes.length > 0) {
      const storedMeals = matchingStoredRecipes.map(recipe => ({
        name: recipe.name,
        description: recipe.description,
        instructions: recipe.instructions,
        macros: {
          carbs: recipe.carbs,
          protein: recipe.protein,
          fats: recipe.fats,
          calories: recipe.calories,
          fiber: recipe.fiber,
          sugar: recipe.sugar,
          cholesterol: recipe.cholesterol,
          sodium: recipe.sodium
        },
        cookingTime: recipe.cookingTime,
        nutrients: recipe.nutrients,
        isStoredRecipe: true,
        dietaryRestriction: recipe.dietaryRestriction
      }));

      // Combine stored recipes with AI-generated ones
      parsedContent.meals = [...storedMeals, ...parsedContent.meals];
    }

    return parsedContent;
  } catch (error: any) {
    console.error("Error in generateMealSuggestions:", error);
    throw error;
  }
}