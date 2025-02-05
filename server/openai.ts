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
const API_TIMEOUT = 60000; // 60 second timeout

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
      systemRole = "You are a professional chef. Provide response only in valid JSON format. Keep recipes simple and focused on the main ingredients provided.";
    } else {
      const storedRecipes = await storage.getRecipes();
      const availableStoredRecipes = storedRecipes.filter(recipe => {
        if (!includeUserRecipes) return false;
        if (excludeRecipes.includes(recipe.name)) return false;
        if (dietaryPreference !== "none") return recipe.dietaryRestriction === dietaryPreference;
        return true;
      });

      const storedRecipesPrompt = availableStoredRecipes.length > 0
        ? `Here are some stored recipes that you can suggest:\n${availableStoredRecipes.map(recipe => `
- ${recipe.name}
  Description: ${recipe.description}
  Macros: ${recipe.carbs}g carbs, ${recipe.protein}g protein, ${recipe.fats}g fats
  Dietary Restriction: ${recipe.dietaryRestriction}
`).join('\n')}`
        : '';

      prompt = `Given these macro nutrient targets:
- Carbohydrates: ${carbs}g
- Protein: ${protein}g
- Fats: ${fats}g

${storedRecipesPrompt}
${excludeRecipes.length > 0 ? `\nPlease do NOT suggest any of these previously suggested recipes: ${excludeRecipes.join(', ')}` : ''}
${dietaryPreference !== "none" ? `\nDietary Preference: ${dietaryPreference}. Please ensure all suggestions comply with ${dietaryPreference} dietary requirements.` : ''}
${recipeLimit ? `\nPlease suggest up to ${recipeLimit} meal options that meet these criteria.` : '\nPlease suggest multiple meal options that meet these criteria.'}
${mealTypes.length > 0 ? `\nThese suggestions should be suitable for the following meal types: ${mealTypes.join(', ')}.` : ''}

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
      systemRole = "You are a nutrition expert. Provide response only in valid JSON format. Include accurate macro calculations for each meal.";
    }

    console.log("Starting generation with mode:", pantryItems ? "pantry-based" : "macro-based");
    console.log("Sending prompt to OpenAI:", prompt);

    const responsePromise = openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemRole
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    // Add timeout to the OpenAI request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("OpenAI API request timed out after 60 seconds")), API_TIMEOUT);
    });

    console.log("Waiting for OpenAI response...");
    const response = await Promise.race([responsePromise, timeoutPromise]);
    console.log("Received response from OpenAI");

    const content = response.choices[0].message.content;
    if (!content) {
      console.error("No content received from OpenAI");
      throw new Error("Failed to generate meal suggestions");
    }

    console.log("Raw response from OpenAI:", content);

    try {
      const parsedContent = JSON.parse(content);
      console.log("Successfully parsed response:", parsedContent);

      if (!parsedContent.meals || !Array.isArray(parsedContent.meals)) {
        console.error("Invalid response format:", parsedContent);
        throw new Error("Invalid response format: missing or invalid meals array");
      }

      // If this was a macro-based request, verify stored recipes
      if (!pantryItems) {
        const storedRecipes = await storage.getRecipes();
        parsedContent.meals = parsedContent.meals.map(meal => ({
          ...meal,
          isStoredRecipe: storedRecipes.some(
            recipe => recipe.name.toLowerCase() === meal.name.toLowerCase()
          )
        }));
      }

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