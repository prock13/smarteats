import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-3.5-turbo" which is a fast and cheap model
export async function generateMealSuggestions(
  carbs: number,
  protein: number,
  fats: number,
  mealCount: number
) {
  try {
    const prompt = `Given the following macro nutrient targets remaining for the day:
- Carbohydrates: ${carbs}g
- Protein: ${protein}g
- Fats: ${fats}g

Please suggest ${mealCount} meal(s) that will help meet these targets. Format the response as a JSON object with this structure:
{
  "meals": [
    {
      "name": "Meal name",
      "description": "Brief description with cooking instructions",
      "macros": {
        "carbs": number,
        "protein": number,
        "fats": number
      }
    }
  ]
}

Make sure the total macros across all meals sum up approximately to the target amounts.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
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