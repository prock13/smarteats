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

export async function generateMealSuggestions(
  carbs: number,
  protein: number,
  fats: number,
  mealTypes: string[],
  dietaryPreference: string = "none",
  recipeLimit?: number,
  excludeRecipes: string[] = [],
  includeUserRecipes: boolean = true,
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
        "fats": number
      }
    }
  ]
}`;
      systemRole = "You are a professional chef. Create recipes that match the given ingredients. Keep your response in valid JSON format.";
    } else {
      const storedRecipes = await storage.getRecipes();
      const availableStoredRecipes = storedRecipes.filter(recipe => {
        if (!includeUserRecipes) return false;
        if (excludeRecipes.includes(recipe.name)) return false;
        if (dietaryPreference !== "none") return recipe.dietaryRestriction === dietaryPreference;
        return true;
      });

      const storedRecipesPrompt = availableStoredRecipes.length > 0
        ? `Available stored recipes:\n${availableStoredRecipes.map(recipe => `
- ${recipe.name}
  Description: ${recipe.description}
  Macros: ${recipe.carbs}g carbs, ${recipe.protein}g protein, ${recipe.fats}g fats
  Dietary Restriction: ${recipe.dietaryRestriction}`).join('\n')}`
        : '';

      prompt = `Create meal suggestions matching these macro targets:
- Carbohydrates: ${carbs}g
- Protein: ${protein}g
- Fats: ${fats}g

${storedRecipesPrompt}
${excludeRecipes.length > 0 ? `\nExclude these recipes: ${excludeRecipes.join(', ')}` : ''}
${dietaryPreference !== "none" ? `\nDietary Restriction: ${dietaryPreference}` : ''}
${recipeLimit ? `\nProvide ${recipeLimit} meal options.` : ''}
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
        "fats": number
      },
      "isStoredRecipe": boolean
    }
  ]
}`;
      systemRole = "You are a nutrition expert. Create recipes with precise macro ratios. Always respond with valid JSON format.";
    }

    console.log("Generating suggestions for mode:", pantryItems ? "pantry-based" : "macro-based");
    console.log("Prompt:", prompt);

    const responsePromise = openai.chat.completions.create({
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

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("OpenAI API request timed out")), API_TIMEOUT);
    });

    console.log("Awaiting OpenAI response...");
    const response = await Promise.race([responsePromise, timeoutPromise]) as any;
    console.log("Received OpenAI response");

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    console.log("Parsing response:", content);
    const parsedContent = JSON.parse(content);

    if (!parsedContent.meals || !Array.isArray(parsedContent.meals)) {
      throw new Error("Invalid response format: missing or invalid meals array");
    }

    if (!pantryItems) {
      const storedRecipes = await storage.getRecipes();
      parsedContent.meals = parsedContent.meals.map(meal => ({
        ...meal,
        isStoredRecipe: storedRecipes.some(recipe => 
          recipe.name.toLowerCase() === meal.name.toLowerCase()
        )
      }));
    }

    return parsedContent;
  } catch (error: any) {
    console.error("Error in generateMealSuggestions:", error);
    if (error?.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a few minutes.");
    }
    throw error;
  }
}