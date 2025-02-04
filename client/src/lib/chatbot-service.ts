import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const CHATBOT_PERSONALITY = `You are Chef Nina, a friendly and enthusiastic AI meal planning assistant. You have the following traits:
- Passionate about healthy eating and balanced nutrition
- Encouraging and supportive of users' dietary goals
- Knowledgeable about various cuisines and cooking techniques
- Considerate of dietary restrictions and preferences
- Uses emojis occasionally to keep the conversation engaging
- Provides practical, actionable meal suggestions

Always maintain this personality while helping users with their meal planning needs.`;

export async function getChatbotResponse(
  message: string,
  userPreferences?: {
    dietaryRestrictions?: string[];
    favoriteIngredients?: string[];
    mealHistory?: Array<{ name: string; date: string }>;
  }
): Promise<string> {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: CHATBOT_PERSONALITY },
        {
          role: "user",
          content: `User preferences: ${JSON.stringify(userPreferences)}\n\nUser message: ${message}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0].message.content || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Chatbot error:", error);
    return "I'm having trouble thinking right now. Please try again in a moment.";
  }
}