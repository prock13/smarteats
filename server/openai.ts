import OpenAI from "openai";
import { storage } from "./storage";
import type { Recipe } from "@shared/schema";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simple rate limiting mechanism
const requestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3; // Maximum 3 requests per minute
const API_TIMEOUT = 30000; // 30 second timeout

function checkRateLimit() {
  const now = Date.now();
  // Remove timestamps older than our window
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

    console.log("Starting meal suggestions generation with:", {
      carbs,
      protein,
      fats,
      mealTypes,
      dietaryPreference,
      recipeLimit,
      excludeRecipes,
      includeUserRecipes,
      pantryItems
    });

    const storedRecipes = await storage.getRecipes();

    const availableStoredRecipes = storedRecipes.filter(recipe => {
      if (!includeUserRecipes) {
        return false;
      }

      if (excludeRecipes.includes(recipe.name)) {
        return false;
      }

      if (dietaryPreference !== "none") {
        return recipe.dietaryRestriction === dietaryPreference;
      }

      return true;
    });

    const storedRecipesPrompt = availableStoredRecipes.length > 0
      ? `Here are some stored recipes that you can suggest. IMPORTANT: Do not modify or combine these recipes, suggest them exactly as they are:\n${availableStoredRecipes.map(recipe => `
- ${recipe.name}
  Description: ${recipe.description}
  Macros: ${recipe.carbs}g carbs, ${recipe.protein}g protein, ${recipe.fats}g fats
  Dietary Restriction: ${recipe.dietaryRestriction}
`).join('\n')}`
      : '';

    const excludeRecipesPrompt = excludeRecipes.length > 0
      ? `\nPlease do NOT suggest any of these previously suggested recipes: ${excludeRecipes.join(', ')}`
      : '';

    const dietaryRestrictionPrompt = dietaryPreference !== "none"
      ? `\nDietary Preference: ${dietaryPreference}. Please ensure all suggestions comply with ${dietaryPreference} dietary requirements.`
      : '';

    const recipeLimitPrompt = recipeLimit
      ? `\nPlease suggest up to ${recipeLimit} meal options that meet these criteria.`
      : '\nPlease suggest multiple meal options that meet these criteria.';

    const mealTypesPrompt = mealTypes.length > 0
      ? `\nThese suggestions should be suitable for the following meal types: ${mealTypes.join(', ')}.`
      : '';

    const pantryPrompt = pantryItems
      ? `\nPlease create recipes using these available ingredients:
- Carbohydrate Source: ${pantryItems.carbSource}
- Protein Source: ${pantryItems.proteinSource}
- Fat Source: ${pantryItems.fatSource}

IMPORTANT: Focus on creating recipes that primarily use these ingredients. You may suggest additional common ingredients (spices, vegetables, etc) to complete the recipe, but the main components should use the provided ingredients.`
      : '';

    const basePrompt = pantryItems
      ? `You are a creative chef. Given the following ingredients and preferences:`
      : `You are a nutrition expert. Given the following macro nutrient targets:
- Carbohydrates: ${carbs}g
- Protein: ${protein}g
- Fats: ${fats}g`;

    const prompt = `${basePrompt}
${pantryPrompt}
${dietaryRestrictionPrompt}
${mealTypesPrompt}
${recipeLimitPrompt}
${excludeRecipesPrompt}

${storedRecipesPrompt}

Please suggest ${mealTypes.length} meal(s) that will help meet these targets. For your suggestions:
1. If a stored recipe matches the requirements closely, suggest it exactly as-is
2. Otherwise, create completely new recipe suggestions
3. IMPORTANT: Never combine or modify stored recipes - either suggest them exactly as-is or create entirely new recipes
4. Ensure all suggestions comply with the dietary preferences specified
5. Consider the specified meal types when making suggestions (e.g., breakfast foods for breakfast)
6. Provide detailed nutritional information and step-by-step cooking instructions
7. IMPORTANT: If using pantry ingredients, ensure the suggested recipes primarily use the provided ingredients

Your response must be a valid JSON object following this exact structure (no additional text):
{
  "meals": [
    {
      "name": "Meal name",
      "description": "Brief description of the meal",
      "instructions": "Detailed step-by-step cooking instructions",
      "macros": {
        "carbs": number,
        "protein": number,
        "fats": number,
        "calories": number,
        "fiber": number,
        "sugar": number
      },
      "nutrients": {
        "vitamins": ["Vitamin A", "Vitamin C", etc],
        "minerals": ["Iron", "Calcium", etc]
      },
      "cookingTime": {
        "prep": number,
        "cook": number,
        "total": number
      },
      "isStoredRecipe": boolean
    }
  ]
}`;

    console.log("Sending prompt to OpenAI:", prompt);

    const responsePromise = openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful nutrition expert. Always respond with valid JSON objects only, no additional text. Never modify or combine existing recipes - suggest them exactly as-is or create entirely new recipes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    // Add timeout to the OpenAI request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("OpenAI API request timed out after 30 seconds")), API_TIMEOUT);
    });

    const response = await Promise.race([responsePromise, timeoutPromise]) as any;

    const content = response.choices[0].message.content;
    if (!content) {
      console.error("No content received from OpenAI");
      throw new Error("Failed to generate meal suggestions");
    }

    console.log("OpenAI raw response:", content);

    try {
      const parsedContent = JSON.parse(content);
      console.log("Parsed OpenAI response:", JSON.stringify(parsedContent, null, 2));

      // Validate the response structure
      if (!parsedContent.meals || !Array.isArray(parsedContent.meals)) {
        console.error("Invalid response format:", parsedContent);
        throw new Error("Invalid response format: missing or invalid meals array");
      }

      // Verify isStoredRecipe flag against actual stored recipes
      parsedContent.meals = parsedContent.meals.map((meal: any) => ({
        ...meal,
        isStoredRecipe: availableStoredRecipes.some(
          recipe => recipe.name.toLowerCase() === meal.name.toLowerCase()
        )
      }));

      return parsedContent;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      throw new Error("Failed to parse meal suggestions");
    }
  } catch (error: any) {
    console.error("Error in generateMealSuggestions:", error);
    if (error?.status === 429) {
      throw new Error("OpenAI API rate limit exceeded. Please try again in a few minutes.");
    } else if (error?.status === 401) {
      throw new Error("Invalid OpenAI API key. Please check your API key and try again.");
    }
    throw error;
  }
}