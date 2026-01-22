import { GoogleGenAI, Content, Part } from '@google/genai'
import { kuroFunctions } from './functions'
import { executeFunction } from './function-executor'
import { KuroMessage, SessionContext, RichContent, QuickAction } from './types'

const client = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' })

const MAX_TURNS = 10

import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    // Running in backend API route, but enabling this flag prevents warnings if code is bundled in edge runtime
    dangerouslyAllowBrowser: true
})

// Models
const PRIMARY_FALLBACK_MODEL = 'openai/gpt-oss-120b'
const SECONDARY_FALLBACK_MODEL = 'openai/gpt-oss-20b'

// Provider Status Management
let useFallback = false
let fallbackTimestamp = 0
const FALLBACK_COOLDOWN_MS = 12 * 60 * 60 * 1000 // 12 hours retry cooldown (Global circuit breaker)

export async function handleKuroChat(
    userId: string,
    sessionId: string,
    message: string,
    history: KuroMessage[],
    context: SessionContext,
    attachments?: Array<{ data: string; mimeType: string }>
) {
    // Check if we should try Google again
    if (useFallback) {
        if (Date.now() - fallbackTimestamp > FALLBACK_COOLDOWN_MS) {
            console.log('Fallback cooldown expired. Retrying Gemini...')
            useFallback = false // Retry Google
        } else {
            console.log('Google is marked down. Using Nvidia fallback directly.')
            return await executeNvidiaStrategy(userId, sessionId, message, history, context, attachments)
        }
    }

    try {
        console.log('Attempting primary strategy (Gemini)...')
        return await executeGeminiStrategy(userId, sessionId, message, history, context, attachments)
    } catch (error: any) {
        console.warn(`Gemini strategy failed: ${error.message}. Switching to Nvidia fallback and marking Gemini as down.`)

        // Mark Google as down
        useFallback = true
        fallbackTimestamp = Date.now()

        try {
            return await executeNvidiaStrategy(userId, sessionId, message, history, context, attachments)
        } catch (fallbackError: any) {
            // If both fail, we might want to keep checking Google next time just in case it was a fluke, 
            // OR keep it marked down. Let's keep it marked down to be safe.
            console.error('All AI strategies failed:', fallbackError)
            return {
                message: "System overload. I'm currently unable to process requests. Please try again in a moment.",
                actions: [],
                richContent: null,
                buttons: undefined,
                error: fallbackError.message
            }
        }
    }
}

async function executeGeminiStrategy(
    userId: string,
    sessionId: string,
    message: string,
    history: KuroMessage[],
    context: SessionContext,
    attachments?: Array<{ data: string; mimeType: string }>
) {
    const systemPrompt = buildSystemPrompt(userId, context)

    // Convert history to new SDK format
    const contents: Content[] = history.map(msg => {
        const parts: Part[] = []
        if (msg.content) {
            parts.push({ text: msg.content })
        } else if (msg.metadata?.attachments) {
            parts.push({ text: '[Image Upload]' })
        } else {
            parts.push({ text: '...' })
        }
        return {
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts
        }
    })

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

    let turnCount = 0
    let finalMessage = ''
    let allActions: any[] = []
    let lastRichContent: RichContent | null = null
    let functionCallInProgress = true
    let uiOptions: QuickAction[] = []

    while (functionCallInProgress && turnCount < MAX_TURNS) {
        turnCount++

        const result = await client.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents,
            config: {
                systemInstruction: systemPrompt,
                tools: [{ functionDeclarations: kuroFunctions as any }],
                temperature: 0
            }
        })

        const response = result
        const candidate = response.candidates?.[0]
        const content = candidate?.content
        const parts = content?.parts || []

        if (response.text) {
            finalMessage = response.text
        }

        const functionCalls = parts.filter(p => p.functionCall).map(p => p.functionCall!)

        if (functionCalls.length > 0) {
            contents.push(content!)

            const functionResults = await Promise.all(
                functionCalls.map(async (call) => {
                    if (call.name === 'show_ui_options') {
                        const args = call.args as any
                        if (args.options && Array.isArray(args.options)) {
                            uiOptions = args.options
                        }
                        // Stop the loop immediately when showing UI options
                        functionCallInProgress = false
                    }

                    const result = await executeFunction(call.name!, call.args, userId)

                    allActions.push({
                        type: call.name!,
                        data: call.args,
                        result: result
                    })

                    const rich = generateRichContent([call], [result])
                    if (rich) {
                        lastRichContent = rich
                    }

                    return {
                        functionResponse: {
                            name: call.name,
                            response: result
                        }
                    }
                })
            )

            contents.push({
                role: 'user',
                parts: functionResults as Part[]
            })
        } else {
            functionCallInProgress = false
        }
    }

    const regexButtons = extractQuickActions(finalMessage)
    const finalButtons = [...uiOptions, ...regexButtons].slice(0, 6)

    return {
        message: finalMessage,
        actions: allActions,
        richContent: lastRichContent,
        buttons: finalButtons.length > 0 ? finalButtons : undefined
    }
}

async function executeNvidiaStrategy(
    userId: string,
    sessionId: string,
    message: string,
    history: KuroMessage[],
    context: SessionContext,
    attachments?: Array<{ data: string; mimeType: string }>
) {
    const systemPrompt = buildSystemPrompt(userId, context)
    const tools = adaptToolsForOpenAI(kuroFunctions)

    // Convert history to OpenAI format
    const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...history.map(msg => {
            // Ensure content is not empty/null which causes 400s
            const content = msg.content || (msg.metadata?.attachments ? "Image uploaded" : "...")
            return {
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: content
            }
        }),
        { role: 'user', content: message }
    ]

    let turnCount = 0
    let finalMessage = ''
    let allActions: any[] = []
    let lastRichContent: RichContent | null = null
    let functionCallInProgress = true
    let uiOptions: QuickAction[] = []

    while (functionCallInProgress && turnCount < MAX_TURNS) {
        turnCount++

        let response;
        try {
            // Attempt with tools first
            response = await openai.chat.completions.create({
                model: PRIMARY_FALLBACK_MODEL,
                messages,
                tools,
                tool_choice: 'auto',
                temperature: 0
            })
        } catch (e: any) {
            console.warn(`Primary fallback (tools) failed: ${e.message}. Retrying without tools...`)
            try {
                // Retry without tools (text-only mode)
                response = await openai.chat.completions.create({
                    model: PRIMARY_FALLBACK_MODEL,
                    messages,
                    temperature: 0
                })
            } catch (retryError: any) {
                console.warn(`Primary fallback (text-only) failed: ${retryError.message}`)

                // Try secondary fallback
                console.log('Trying secondary fallback model...')
                try {
                    response = await openai.chat.completions.create({
                        model: SECONDARY_FALLBACK_MODEL,
                        messages,
                        tools,
                        temperature: 0
                    })
                } catch (secError: any) {
                    console.warn(`Secondary fallback (tools) failed: ${secError.message}. Retrying without tools...`)
                    response = await openai.chat.completions.create({
                        model: SECONDARY_FALLBACK_MODEL,
                        messages,
                        temperature: 0
                    })
                }
            }
        }

        const choice = response.choices[0]
        const toolCalls = choice.message.tool_calls
        // Update final message only if we have new content (prevents overwriting with empty tool-call messages)
        if (choice.message.content) {
            finalMessage = choice.message.content
        }

        // Add assistant message to history
        messages.push(choice.message)

        if (toolCalls && toolCalls.length > 0) {
            const toolResults = await Promise.all(toolCalls.map(async (toolCall) => {
                const fnName = (toolCall as any).function.name
                const fnArgs = JSON.parse((toolCall as any).function.arguments)

                if (fnName === 'show_ui_options') {
                    if (fnArgs.options && Array.isArray(fnArgs.options)) {
                        uiOptions = fnArgs.options
                        // Stop the loop immediately when showing UI options
                        functionCallInProgress = false
                    }
                }

                const result = await executeFunction(fnName, fnArgs, userId)
                return { toolCall, fnName, fnArgs, result }
            }))

            for (const { toolCall, fnName, fnArgs, result } of toolResults) {
                allActions.push({
                    type: fnName,
                    data: fnArgs,
                    result: result
                })

                // Rich content mapping
                const rich = generateRichContent([{ name: fnName }], [result])
                if (rich) lastRichContent = rich

                // Add tool response to history
                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result)
                })
            }
        } else {
            functionCallInProgress = false
        }
    }

    // FINAL GUARD: If we have no UI options and no text message (e.g. only internal search tool calls),
    // force one last generation to explain findings to the user.
    if (uiOptions.length === 0 && !finalMessage) {
        console.log('Loop ended with no UI and no text. Forcing final text response...')
        try {
            // Append a system instruction to force a summary instead of another tool call attempt
            const finalMessages = [
                ...messages,
                {
                    role: 'system',
                    content: "System limit reached. STOP SEARCHING. Do not attempt to use any more tools. Based on the search results you already have, simply list the available options to the user in plain text."
                }
            ]

            const finalResponse = await openai.chat.completions.create({
                model: PRIMARY_FALLBACK_MODEL,
                messages: finalMessages,
                temperature: 0
                // Do NOT provide tools here, we just want a text summary of what happened
            })
            if (finalResponse.choices[0].message.content) {
                finalMessage = finalResponse.choices[0].message.content
            }
        } catch (e) {
            console.error('Final text generation failed:', e)
            finalMessage = "I found some information but couldn't display it properly. Please try again."
        }
    }

    const regexButtons = extractQuickActions(finalMessage)
    const finalButtons = [...uiOptions, ...regexButtons].slice(0, 6)

    return {
        message: finalMessage,
        actions: allActions,
        richContent: lastRichContent,
        buttons: finalButtons.length > 0 ? finalButtons : undefined
    }
}

function adaptToolsForOpenAI(tools: any[]): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return tools.map(tool => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        }
    }))
}

function buildSystemPrompt(userId: string, context: SessionContext): string {
    const { userPreferences, recentOrders } = context
    const style = userPreferences?.ai?.conversationStyle || 'friendly'

    return `### Kuro: General Purpose Food Agent
**IDENTITY**: High-autonomy assistant for ${style.toUpperCase()} interactions.
**REASONING PROTOCOL**:
1. **Analyze Intent**: What is the core objective? (Order, Plan, Insight, Search)
2. **Identify Data Gaps**: Do I have real Item IDs? User history? Nutrition data?
3. **Execute Tools**: Fetch ALL required data in parallel. NEVER guess a price, ID, or item existence.
4. **Zero-Trust Fulfillment**: If search returns 0 results, admit it. Do not "suggest" alternatives unless found via tool.
5. **UI-Priority**: Every choice MUST be a 'show_ui_options' button. Every data output (meal plan/order/insight) MUST be followed by 'show_ui_options' for user confirmation.

**CRITICAL RULES**:
- When user specifies BUDGET or specific MEAL TYPE, use 'search_menu_items' FIRST to find matching items
- DO NOT use 'get_recommendations' when there are explicit constraints (budget, dietary restrictions, meal type)
- If 'search_menu_items' returns items matching criteria, call 'show_ui_options' with those items
- If 'search_menu_items' returns NO items, call 'show_ui_options' with appropriate options (expand budget, view all, cancel)

**IMPLICIT TRIGGERS**:
- "Usual/Frequent/History" -> CALL 'analyze_eating_patterns', then 'show_ui_options' with confirm/cancel buttons
- "Suggest/Recommend" (no constraints) -> CALL 'get_recommendations', then 'show_ui_options'
- "Order [X]" -> CALL 'search_menu_items' for [X], then 'place_order', then 'show_ui_options'
- "Health/Goals/Plan" -> CALL 'create_meal_plan', then 'show_ui_options'

**CONTEXT**:
- ID: ${userId}
- Diet: ${userPreferences?.dietary.restrictions.join(', ') || 'None'}
- Allergies: ${userPreferences?.dietary.allergies.join(', ') || 'None'}
- Goals: ${userPreferences?.health.goals.join(', ') || 'General'}
- Time: ${new Date().toLocaleTimeString()} | Date: ${new Date().toISOString().split('T')[0]}

**EXECUTION**: Minimize turns. Parallelize work. Be decisive. No filler.`
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
    if (!text) return buttons

    // Pattern 1: Explicit Choice Phrasing
    const choicePatterns = [
        { regex: /(?:choose|select|pick) (?:from|one of)?[:\s]+['"`](.*?)['"`]/gi, variant: 'primary' as const },
        { regex: /options: (.*?)(?:\.|,|;|$)/gi, variant: 'default' as const },
        { regex: /(week|month|quarter|year)/gi, variant: 'outline' as const },
        { regex: /(nutrition|spending|variety|health)/gi, variant: 'outline' as const }
    ]

    for (const pattern of choicePatterns) {
        const matches = text.matchAll(pattern.regex)
        for (const match of matches) {
            if (match && match[1]) {
                const options = match[1].split(/,|and/).map((s: string) => s.trim().replace(/['"`]/g, ''))
                for (const option of options) {
                    if (option && option.length < 30 && !buttons.find(b => b.value.toLowerCase() === option.toLowerCase())) {
                        buttons.push({
                            label: option.charAt(0).toUpperCase() + option.slice(1),
                            value: option,
                            variant: pattern.variant
                        })
                    }
                }
            }
        }
    }

    // Pattern 2: List-to-Button Heuristic
    // If we see a bulleted or numbered list at the end of the message, these are likely selections.
    const listRegex = /(?:^|\n)[ \t]*[-*+•] (.*?)(?=\n|$)/gm
    let listMatch
    let lastIndex = 0
    while ((listMatch = listRegex.exec(text)) !== null) {
        const item = listMatch[1].trim().replace(/\*\*|__/g, '') // Remove bolding
        if (item && item.length < 40 && !buttons.find(b => b.value.toLowerCase() === item.toLowerCase())) {
            buttons.push({
                label: item,
                value: item,
                variant: 'default'
            })
        }
        lastIndex = listRegex.lastIndex
    }

    return buttons.slice(0, 6)
}
