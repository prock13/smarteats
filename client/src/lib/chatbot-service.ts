interface ChatbotResponse {
  message: string;
}

export async function getChatbotResponse(
  message: string,
  userPreferences?: {
    dietaryRestrictions?: string[];
    favoriteIngredients?: string[];
    mealHistory?: Array<{ name: string; date: string }>;
  }
): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userPreferences,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get chatbot response');
    }

    const data: ChatbotResponse = await response.json();
    return data.message;
  } catch (error) {
    console.error("Chatbot error:", error);
    return "I'm having trouble thinking right now. Please try again in a moment.";
  }
}