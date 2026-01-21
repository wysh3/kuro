import { GoogleGenAI, Content, Part } from '@google/genai'
import { kuroFunctions } from './functions'
import { executeFunction } from './function-executor'
import { KuroMessage, SessionContext, RichContent, QuickAction } from './types'

const client = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' })

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

        // Convert history to new SDK format
        const contents: Content[] = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }))

        // Add current message with attachments
        const currentMessageParts: Part[] = [{ text: message }]
        if (attachments && attachments.length > 0) {
            attachments.forEach(att => {
                currentMessageParts.push({
                    inlineData: {
                        data: att.data,
                        mimeType: att.mimeType
                    }
                })
            })
        }

        contents.push({
            role: 'user',
            parts: currentMessageParts
        })

        const result = await client.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents,
            config: {
                systemInstruction: systemPrompt,
                tools: [{ functionDeclarations: kuroFunctions as any }]
            }
        })

        const response = result
        const candidate = response.candidates?.[0]
        const content = candidate?.content
        const parts = content?.parts || []

        let finalMessage = response.text || ''
        let functionCalls = parts.filter(p => p.functionCall).map(p => p.functionCall!)
        let actions: any[] = []
        let richContent: RichContent | null = null

        if (functionCalls.length > 0) {
            const functionResults = await Promise.all(
                functionCalls.map(async (call) => {
                    const result = await executeFunction(call.name!, call.args, userId)
                    return {
                        functionResponse: {
                            name: call.name,
                            response: result
                        }
                    }
                })
            )

            // Add the model's first turns (with function calls) and the function results to the conversation
            contents.push(content!)
            contents.push({
                role: 'user',
                parts: functionResults as Part[]
            })

            const finalResult = await client.models.generateContent({
                model: 'gemini-2.5-flash-lite',
                contents,
                config: {
                    systemInstruction: systemPrompt,
                    tools: [{ functionDeclarations: kuroFunctions as any }]
                }
            })

            finalMessage = finalResult.text || ''

            actions = functionCalls.map((call, index) => ({
                type: call.name!,
                data: call.args,
                result: functionResults[index].functionResponse.response
            }))
            richContent = generateRichContent(functionCalls, functionResults.map(r => r.functionResponse.response))
        }

        const buttons = extractQuickActions(finalMessage)

        return {
            message: finalMessage,
            actions,
            richContent,
            buttons: buttons.length > 0 ? buttons : undefined
        }
    } catch (error: any) {
        console.error('Error in handleKuroChat:', error)
        return {
            message: "I'm sorry, I encountered a neural link failure. Please try again later.",
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

function extractQuickActions(text: string): QuickAction[] {
    const buttons: QuickAction[] = []

    const patterns = [
        { regex: /choose from ['"](.*?)['"]/gi, variant: 'primary' as const },
        { regex: /choose from ['`](.*?)['`]/gi, variant: 'primary' as const },
        { regex: /options: (.*?)(?:\.|,|;|$)/gi, variant: 'default' as const },
        { regex: /(week|month|quarter|year)/gi, variant: 'outline' as const },
        { regex: /(nutrition|spending|variety|health)/gi, variant: 'outline' as const }
    ]

    for (const pattern of patterns) {
        const match = text.match(pattern.regex)
        if (match) {
            const options = match[1].split(/,|and/).map((s: string) => s.trim().replace(/['"`]/g, ''))
            for (const option of options) {
                if (option && !buttons.find(b => b.value.toLowerCase() === option.toLowerCase())) {
                    buttons.push({
                        label: option.charAt(0).toUpperCase() + option.slice(1),
                        value: option,
                        variant: pattern.variant
                    })
                }
            }
        }
    }

    return buttons.slice(0, 6)
}
