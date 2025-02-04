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
) {
  try {
    checkRateLimit();

    const storedRecipes = await storage.getRecipes();

    // Filter out recipes that should be excluded and don't match dietary preference
    const availableStoredRecipes = storedRecipes.filter(recipe => {
      // If user doesn't want to include their recipes, return false
      if (!includeUserRecipes) {
        return false;
      }

      // Exclude recipes that were already suggested
      if (excludeRecipes.includes(recipe.name)) {
        return false;
      }

      // If user requests a specific dietary preference
      if (dietaryPreference !== "none") {
        // Only include recipes that exactly match the preference
        return recipe.dietaryRestriction === dietaryPreference;
      }

      // If no preference specified, include all recipes
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

    const prompt = `You are a nutrition expert. Given the following macro nutrient targets:
- Carbohydrates: ${carbs}g
- Protein: ${protein}g
- Fats: ${fats}g
${dietaryRestrictionPrompt}
${mealTypesPrompt}
${recipeLimitPrompt}
${excludeRecipesPrompt}

${storedRecipesPrompt}

Please suggest ${mealTypes.length} meal(s) that will help meet these targets. For your suggestions:
1. If a stored recipe matches the macro requirements closely (within 20%), suggest it exactly as-is
2. Otherwise, create completely new recipe suggestions
3. IMPORTANT: Never combine or modify stored recipes - either suggest them exactly as-is or create entirely new recipes
4. Ensure all suggestions comply with the dietary preferences specified
5. Consider the specified meal types when making suggestions (e.g., breakfast foods for breakfast)
6. Provide detailed nutritional information and step-by-step cooking instructions
7. IMPORTANT: The macros (carbs, protein, fats) in your suggestions should be close to the target values. Do not exceed the targets by more than 10%.

IMPORTANT: You must respond with ONLY a JSON object, no other text. The response must strictly follow this structure:
{
  "meals": [
    {
      "name": "Meal name",
      "description": "Brief description of the meal",
      "instructions": "Detailed step-by-step cooking instructions",
      "macros": {
        "carbs": number (should closely match target carbs),
        "protein": number (should closely match target protein),
        "fats": number (should closely match target fats),
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

    const response = await openai.chat.completions.create({
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

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Failed to generate meal suggestions");
    }

    console.log("OpenAI response:", content);

    try {
      const parsedContent = JSON.parse(content);
      console.log("Parsed OpenAI response:", parsedContent);

      // Validate the response structure
      if (!parsedContent.meals || !Array.isArray(parsedContent.meals)) {
        throw new Error("Invalid response format: missing or invalid meals array");
      }

      // Verify isStoredRecipe flag against actual stored recipes
      parsedContent.meals = parsedContent.meals.map(meal => ({
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
    if (error?.status === 429) {
      throw new Error("OpenAI API rate limit exceeded. Please try again in a few minutes.");
    } else if (error?.status === 401) {
      throw new Error("Invalid OpenAI API key. Please check your API key and try again.");
    }
    throw error;
  }
}