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
  dietaryPreferences,
  mealTypes
}: {
  targetCarbs: number;
  targetProtein: number;
  targetFats: number;
  dietaryPreferences: string[];
  mealTypes: string[];
}) {
  try {
    checkRateLimit();

    const prompt = `Create a recipe that matches these macro targets:
- Carbohydrates: ${targetCarbs}g
- Protein: ${targetProtein}g
- Fats: ${targetFats}g
${dietaryPreferences.length > 0 && !dietaryPreferences.includes("none") ? `\nDietary Preferences: ${dietaryPreferences.join(", ")}` : ''}
${mealTypes.length > 0 ? `\nMeal Types: ${mealTypes.join(", ")}` : ''}

Format your response as a JSON object with this exact structure:
{
  "name": "Recipe name",
  "description": "Brief description",
  "ingredients": ["List of ingredients with quantities"],
  "instructions": "Step-by-step instructions",
  "servingSize": "Serving size in detail (e.g., '2 cups', '1 large portion', '4 servings')",
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

Include detailed nutritional information, precise serving size, and cooking time. Always provide specific, measurable serving sizes (e.g., '2 cups' instead of 'medium portion'). If you're unsure about any value, use null.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional nutritionist and chef. Create detailed recipes with precise macro ratios, serving sizes, and complete nutritional information. Always provide measurements in grams for macros and milligrams for micronutrients. Specify serving sizes in clear, measurable units."
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const parsedContent = JSON.parse(content);
    return {
      name: parsedContent.name,
      description: parsedContent.description,
      ingredients: parsedContent.ingredients,
      instructions: parsedContent.instructions,
      servingSize: parsedContent.servingSize,
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
      dietaryRestrictions: dietaryPreferences
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
  dietaryPreferences: string[] = ["none"],
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

        // Check if recipe meets any of the dietary preferences
        if (!dietaryPreferences.includes("none") &&
            !dietaryPreferences.includes(recipe.dietaryRestriction)) {
          return false;
        }

        // Basic macro matching (within 20% tolerance)
        const carbMatch = Math.abs(recipe.carbs - carbs) <= carbs * 0.2;
        const proteinMatch = Math.abs(recipe.protein - protein) <= protein * 0.2;
        const fatMatch = Math.abs(recipe.fats - fats) <= fats * 0.2;

        return carbMatch && proteinMatch && fatMatch;
      });
    }

    const format = `Format your response as a JSON object with this exact structure:
{
  "meals": [
    {
      "name": "Recipe name",
      "description": "Brief description",
      "ingredients": ["List of ingredients with quantities"],
      "instructions": "Step-by-step instructions",
      "servingSize": "Serving size (e.g., '1 cup' or '2 servings')",
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

    if (pantryItems) {
      prompt = `Create a recipe using these ingredients:
- Main carb: ${pantryItems.carbSource}
- Main protein: ${pantryItems.proteinSource}
- Main fat: ${pantryItems.fatSource}

The recipe should be suitable for: ${mealTypes[0]}
${dietaryPreferences.length > 0 && !dietaryPreferences.includes("none")
  ? `\nDietary Preferences: ${dietaryPreferences.join(", ")}`
  : ''}

${format}`;
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
${dietaryPreferences.length > 0 && !dietaryPreferences.includes("none")
  ? `\nDietary Preferences: ${dietaryPreferences.join(", ")}`
  : ''}
${mealTypes.length > 0 ? `\nMeal types: ${mealTypes.join(', ')}` : ''}

${format}`;
      systemRole = "You are a nutrition expert. Create recipes with precise macro ratios and complete nutritional information. Always respond with valid JSON format. Create completely new recipes that accommodate all specified dietary preferences.";
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
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        servingSize: recipe.servingSize,
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

export async function generateIngredientSubstitutions({
  ingredient,
  dietaryPreferences = ["none"],
  quantity,
  unit,
}: {
  ingredient: string;
  dietaryPreferences?: string[];
  quantity?: number;
  unit?: string;
}) {
  try {
    checkRateLimit();

    const prompt = `Suggest substitutes for ${quantity ? `${quantity} ${unit} of ` : ""}${ingredient}
${dietaryPreferences.length > 0 && !dietaryPreferences.includes("none") ? `\nDietary Preferences: ${dietaryPreferences.join(", ")}` : ''}

Format your response as a JSON object with this exact structure:
{
  "substitutes": [
    {
      "ingredient": "Name of substitute ingredient",
      "quantity": number,
      "unit": "Measurement unit",
      "conversion": "How to convert from original (e.g., '1:1 replacement' or '2 tbsp for every 1 tbsp')",
      "nutritionalSimilarity": "Description of how nutritionally similar it is",
      "cookingAdjustments": "Any needed adjustments to cooking method or time",
      "tasteImpact": "How it affects the taste of the dish",
      "dietaryInfo": ["Array of dietary categories this fits (e.g., vegan, gluten-free)"]
    }
  ]
}

Provide 3-5 practical substitutes that match any dietary preferences. Focus on common ingredients that people might have at home.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional chef and nutritionist specializing in ingredient substitutions. Provide practical, readily available substitutes that maintain the dish's integrity while accommodating dietary restrictions. Consider nutritional value, cooking properties, and taste impact in your suggestions."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const parsedContent = JSON.parse(content);
    return parsedContent;
  } catch (error: any) {
    console.error("Error in generateIngredientSubstitutions:", error);
    throw error;
  }
}