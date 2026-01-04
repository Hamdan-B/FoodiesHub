import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

/**
 * Get Gemini model instance
 */
export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

/**
 * Chatbot prompt template - restricted to FoodiesHub context
 */
export const CHATBOT_SYSTEM_PROMPT = `You are a helpful assistant for FoodiesHub, a food delivery platform. 
You can only answer questions related to:
- FoodiesHub website FAQs
- Food recommendations
- Nutrition information and explanations
- Ordering process
- Restaurant information

If asked about unrelated topics, politely redirect to FoodiesHub-related questions.`;

/**
 * Nutrition estimation prompt template
 */
export const NUTRITION_PROMPT_TEMPLATE = (foodName, description, category, portionSize) => {
  return `Estimate the nutritional information for the following food item:
- Name: ${foodName}
- Description: ${description}
- Category: ${category}
- Portion Size: ${portionSize}

Provide ONLY a JSON response with the following structure (no additional text):
{
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>
}`;
};

/**
 * Group-based food recommendation prompt template
 */
export const RECOMMENDATION_PROMPT_TEMPLATE = (groupSize, filters = {}) => {
  const { calories, budget, category } = filters;
  let prompt = `Recommend food items suitable for a group of ${groupSize} people from FoodiesHub.`;
  
  if (calories) prompt += ` Target calories: ${calories}.`;
  if (budget) prompt += ` Budget: ${budget}.`;
  if (category) prompt += ` Category preference: ${category}.`;
  
  prompt += ` Provide 5-7 recommendations with brief descriptions. Format as a JSON array with objects containing: name, description, estimatedPrice, category.`;
  
  return prompt;
};

/**
 * Generate nutrition information using AI
 */
export async function generateNutrition(foodName, description, category, portionSize = '1 serving') {
  try {
    const model = getGeminiModel();
    const prompt = NUTRITION_PROMPT_TEMPLATE(foodName, description, category, portionSize);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse nutrition data');
  } catch (error) {
    console.error('Error generating nutrition:', error);
    throw error;
  }
}

/**
 * Get food recommendations based on group size and filters
 */
export async function getFoodRecommendations(groupSize, filters = {}) {
  try {
    const model = getGeminiModel();
    const prompt = RECOMMENDATION_PROMPT_TEMPLATE(groupSize, filters);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse recommendations');
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
}

/**
 * Chat with AI chatbot (FoodiesHub context only)
 */
export async function chatWithBot(userMessage, conversationHistory = []) {
  try {
    const model = getGeminiModel();
    
    // Build conversation context
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
    
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: CHATBOT_SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'I understand. I will only answer FoodiesHub-related questions.' }] },
        ...history,
      ],
    });
    
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('Error chatting with bot:', error);
    throw error;
  }
}

