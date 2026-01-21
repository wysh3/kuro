import { GoogleGenerativeAI } from '@google/generative-ai'
import { kuroFunctions } from './functions'
import { executeFunction } from './function-executor'
import { KuroMessage, SessionContext, RichContent } from './types'

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '')

export async function handleKuroChat(
    userId: string,
    sessionId: string,
    message: string,
    history: KuroMessage[],
    context: SessionContext,
    attachments?: Array<{ data: string; mimeType: string }>
) {
    try {
        const systemPrompt = buildSystemPrompt(userId, context)

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            systemInstruction: systemPrompt,
            tools: [{ functionDeclarations: kuroFunctions as any }]
        })

        const chat = model.startChat({
            history: history.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }))
        })

        let messageParts: any[] = [{ text: message }]
        if (attachments && attachments.length > 0) {
            messageParts = [
                { text: message },
                ...attachments.map(att => ({
                    inlineData: {
                        data: att.data,
                        mimeType: att.mimeType
                    }
                }))
            ]
        }

        let result = await chat.sendMessage(messageParts)
        let response = result.response
        let functionCalls = response.functionCalls()

        let finalMessage = response.text()
        let actions: any[] = []
        let richContent: RichContent | null = null

        if (functionCalls && functionCalls.length > 0) {
            const functionResults = await Promise.all(
                functionCalls.map(async (call) => {
                    const result = await executeFunction(call.name, call.args, userId)
                    return {
                        functionResponse: {
                            name: call.name,
                            response: result
                        }
                    }
                })
            )

            const finalResult = await chat.sendMessage(functionResults as any)
            finalMessage = finalResult.response.text()
            actions = functionCalls.map((call, index) => ({
                type: call.name,
                data: call.args,
                result: functionResults[index].functionResponse.response
            }))
            richContent = generateRichContent(functionCalls, functionResults.map(r => r.functionResponse.response))
        }

        return {
            message: finalMessage,
            actions,
            richContent
        }
    } catch (error: any) {
        console.error('Error in handleKuroChat:', error)
        return {
            message: "I'm sorry, I encountered an error. Please try again later.",
            actions: [],
            richContent: null,
            error: error.message
        }
    }
}

function buildSystemPrompt(userId: string, context: SessionContext): string {
    const { userPreferences, recentOrders } = context
    const style = userPreferences?.ai?.conversationStyle || 'friendly'

    return `You are Kuro, an intelligent food ordering and nutrition assistant for a campus food delivery service.
Your personality is ${style.toUpperCase()}.

**Your Capabilities:**
- Place food orders via natural language
- Create personalized meal plans (daily, weekly, monthly)
- Provide nutrition information and health insights
- Analyze eating patterns and make recommendations
- Answer questions about menu items, ingredients, and dietary options
- Help with kitchen operations (for staff users)

**User Context:**
- User ID: ${userId}
- Dietary Restrictions: ${userPreferences?.dietary.restrictions.join(', ') || 'None'}
- Allergies: ${userPreferences?.dietary.allergies.join(', ') || 'None'}
- Health Goals: ${userPreferences?.health.goals.join(', ') || 'Not specified'}
- Activity Level: ${userPreferences?.health.activityLevel || 'moderate'}
- Recent Orders: ${recentOrders?.length || 0} orders in the last 7 days

**Conversation Style (${style}):**
${style === 'concise' ? '- Be brief and direct. Use technical terms. Minimize filler.' : ''}
${style === 'friendly' ? '- Be warm, encouraging, and use appropriate emojis. Build rapport.' : ''}
${style === 'detailed' ? '- Provide thorough explanations, nutritional science, and multiple options.' : ''}
- Always confirm before placing orders
- Provide nutritional context when relevant
- Suggest alternatives if user's request conflicts with their goals

**Important Rules:**
1. ALWAYS use function calls for actions (ordering, meal planning, etc.)
2. NEVER make up menu items or prices
3. ALWAYS consider user's dietary restrictions and allergies
4. If user asks about kitchen operations and they're not staff, politely explain it's for staff only

**Current Date:** ${new Date().toISOString().split('T')[0]}
**Current Time:** ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
`
}

function generateRichContent(functionCalls: any[], results: any[]): RichContent | null {
    if (!functionCalls || functionCalls.length === 0) return null

    const firstCall = functionCalls[0]
    const firstResult = results[0]

    switch (firstCall.name) {
        case 'create_meal_plan':
            return {
                type: 'meal_plan_card',
                data: firstResult
            }
        case 'place_order':
            return {
                type: 'order_preview_card',
                data: firstResult
            }
        case 'analyze_eating_patterns':
            return {
                type: 'nutrition_chart',
                data: firstResult
            }
        case 'get_recommendations':
            return {
                type: 'product_carousel',
                data: firstResult
            }
        default:
            return null
    }
}
