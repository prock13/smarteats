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
  mealCount: number
) {
  try {
    // Check rate limit before making the request
    checkRateLimit();

    // Fetch stored recipes
    const storedRecipes = await storage.getRecipes();

    const storedRecipesPrompt = storedRecipes.length > 0
      ? `Here are some stored recipes that you can consider along with suggesting new recipes:
${storedRecipes.map(recipe => `
- ${recipe.name}
  Description: ${recipe.description}
  Macros: ${recipe.carbs}g carbs, ${recipe.protein}g protein, ${recipe.fats}g fats
`).join('\n')}`
      : '';

    const prompt = `Given the following macro nutrient targets remaining for the day:
- Carbohydrates: ${carbs}g
- Protein: ${protein}g
- Fats: ${fats}g

${storedRecipesPrompt}

Please suggest ${mealCount} meal(s) that will help meet these targets. For your suggestions:
1. Include a mix of both stored recipes and new creative meal ideas
2. Aim to include at least one stored recipe if it reasonably fits the macro requirements
3. Always suggest new creative meals even if there are perfect matches in stored recipes

You must respond with ONLY a valid JSON object in this exact structure, without any additional text or explanation:
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
}

Make sure the total macros across all meals sum up approximately to the target amounts.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Failed to generate meal suggestions");
    }

    return JSON.parse(content);
  } catch (error: any) {
    if (error?.status === 429) {
      throw new Error("OpenAI API rate limit exceeded. Please try again in a few minutes.");
    } else if (error?.status === 401) {
      throw new Error("Invalid OpenAI API key. Please check your API key and try again.");
    }
    throw error;
  }
}