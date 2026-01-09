import { geminiModel, isMockMode } from './config';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatContext {
    menuItems: any[];
    conversationHistory: ChatMessage[];
    userPreferences?: {
        budget?: number;
        allergies?: string[];
        dietaryRestrictions?: string[];
    };
}

export interface ChatResponse {
    message: string;
    suggestedItems?: Array<{
        name: string;
        price: number;
        reason: string;
    }>;
    mealPlan?: any;
    orderConfirmation?: {
        items: Array<{
            name: string;
            price: number;
        }>;
        total: number;
    };
    action?: 'add_to_cart' | 'show_menu' | 'create_plan' | 'confirm_order' | 'none';
    actionData?: any;
}

// Mock response for testing
function getMockChatResponse(userMessage: string, context: ChatContext): ChatResponse {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('protein') || lowerMessage.includes('muscle')) {
        return {
            message: "Great choice! For high protein, I recommend these items from our menu:",
            suggestedItems: [
                { name: 'Paneer Tikka', price: 120, reason: '20g protein, perfect for muscle building' },
                { name: 'Chole Bhature', price: 90, reason: '18g protein from chickpeas' },
                { name: 'Dal Tadka with Rice', price: 80, reason: '15g protein, complete amino acids' }
            ],
            action: 'none'
        };
    }

    if (lowerMessage.includes('budget') || lowerMessage.includes('cheap')) {
        return {
            message: "I've found the best value options for you:",
            suggestedItems: [
                { name: 'Poha', price: 40, reason: 'Filling breakfast, great value' },
                { name: 'Masala Chai', price: 20, reason: 'Perfect energy boost' },
                { name: 'Dal Tadka with Rice', price: 80, reason: 'Complete meal under ₹100' }
            ],
            action: 'none'
        };
    }

    return {
        message: "I can help you find the perfect meal! Tell me about your goals - are you looking for high protein, budget-friendly options, or a balanced meal plan?",
        action: 'none'
    };
}

export async function chatWithAgent(
    userMessage: string,
    context: ChatContext
): Promise<ChatResponse> {
    // Return mock data if in mock mode
    if (isMockMode) {
        console.log('🤖 Using mock chat response (no API key configured)');
        return getMockChatResponse(userMessage, context);
    }

    try {
        // Build conversation context
        const menuContext = JSON.stringify(context.menuItems.map(item => ({
            name: item.name,
            price: item.price,
            category: item.category,
            calories: item.calories || 300,
            protein: item.protein || 10,
            isVeg: item.isVeg !== false
        })));

        const conversationHistory = context.conversationHistory
            .map(msg => `${msg.role === 'user' ? 'Student' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        const systemPrompt = `You are a helpful AI nutritionist assistant for MRC Canteen at Amity University.

AVAILABLE MENU:
${menuContext}

YOUR CAPABILITIES:
1. Recommend menu items based on student goals (protein, budget, healthy, weight loss)
2. Create personalized meal plans
3. Answer nutrition questions
4. Help students make informed food choices
5. Create order confirmations when students want to place orders

CONVERSATION HISTORY:
${conversationHistory}

RESPONSE FORMAT (JSON):
{
  "message": "Your friendly response to the student",
  "suggestedItems": [
    {
      "name": "Item name from menu",
      "price": 120,
      "reason": "Why you're recommending this"
    }
  ],
  "orderConfirmation": {
    "items": [
      {
        "name": "Item name",
        "price": 120
      }
    ],
    "total": 240
  },
  "action": "add_to_cart" | "show_menu" | "create_plan" | "confirm_order" | "none",
  "actionData": {} // Optional data for the action
}

RULES:
1. Be friendly and conversational
2. Only recommend items that exist in the menu
3. Explain WHY you're recommending each item
4. Keep responses concise but informative
5. If student wants to add items, set action to "add_to_cart"
6. If student wants a meal plan, set action to "create_plan"
7. If student says "order this", "I want to order", "place order", or similar, create an orderConfirmation with the items they mentioned and set action to "confirm_order"
8. When creating orderConfirmation, calculate the total price correctly
9. Always return valid JSON

Student's message: ${userMessage}`;

        console.log('🤖 Calling Gemini chat API...');
        const result = await geminiModel.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        console.log('📝 Gemini chat response received, length:', text?.length || 0);

        if (!text || text.trim().length === 0) {
            throw new Error('Empty response from Gemini API');
        }

        // Parse JSON response
        const jsonText = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const chatResponse: ChatResponse = JSON.parse(jsonText);
        console.log('✅ Chat response parsed successfully');

        return chatResponse;
    } catch (error) {
        console.error('❌ Error in chat agent:', error);
        console.log('⚠️ Falling back to mock chat response');
        return getMockChatResponse(userMessage, context);
    }
}
