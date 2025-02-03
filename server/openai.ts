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
) {
  try {
    checkRateLimit();

    const storedRecipes = await storage.getRecipes();

    const storedRecipesPrompt = storedRecipes.length > 0
      ? `Here are some stored recipes that you can consider along with suggesting new recipes:
${storedRecipes.map(recipe => `
- ${recipe.name}
  Description: ${recipe.description}
  Macros: ${recipe.carbs}g carbs, ${recipe.protein}g protein, ${recipe.fats}g fats
`).join('\n')}`
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

${storedRecipesPrompt}

Please suggest ${mealTypes.length} meal(s) that will help meet these targets. For your suggestions:
1. Include a mix of both stored recipes and new creative meal ideas
2. Aim to include at least one stored recipe if it reasonably fits the macro requirements
3. Always suggest new creative meals even if there are perfect matches in stored recipes
4. Ensure all suggestions comply with the dietary preferences specified
5. Consider the specified meal types when making suggestions (e.g., breakfast foods for breakfast)

IMPORTANT: You must respond with ONLY a JSON object, no other text. The response must strictly follow this structure:
{
  "meals": [
    {
      "name": "Meal name",
      "description": "Brief description with cooking instructions",
      "macros": {
        "carbs": number,
        "protein": number,
        "fats": number
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
          content: "You are a helpful nutrition expert. Always respond with valid JSON objects only, no additional text."
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