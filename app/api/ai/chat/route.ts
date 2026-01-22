import { NextRequest, NextResponse } from 'next/server'
import { handleKuroChat } from '@/lib/ai/chat-handler'
import { getUserPreferences, createKuroSession, saveKuroMessage } from '@/lib/firebase/ai-db-admin'
import { getMenuItems, getOrdersByUserId } from '@/lib/firebase/db-admin'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, sessionId, message, history = [], attachments } = body

        if (!userId || !message) {
            return NextResponse.json(
                { success: false, error: 'User ID and message are required' },
                { status: 400 }
            )
        }

        // Fetch user context
        const [preferences, orders] = await Promise.all([
            getUserPreferences(userId),
            getOrdersByUserId(userId)
        ])

        const context = {
            userPreferences: preferences || undefined,
            recentOrders: orders.slice(0, 10).map(o => o.id)
        }

        // Process chat
        const result = await handleKuroChat(userId, sessionId, message, history, context, attachments)

        // Handle session and message persistence
        let effectiveSessionId = sessionId;
        if (!effectiveSessionId) {
            effectiveSessionId = await createKuroSession(userId, message.slice(0, 30) + (message.length > 30 ? '...' : ''));
        }

        // Save messages in background
        await Promise.all([
            saveKuroMessage(userId, effectiveSessionId, {
                role: 'user',
                content: message
            }),
            saveKuroMessage(userId, effectiveSessionId, {
                role: 'assistant',
                content: result.message,
                metadata: {
                    richContent: result.richContent || undefined,
                    actions: result.actions || undefined,
                    buttons: result.buttons || undefined
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            sessionId: effectiveSessionId,
            ...result
        })
    } catch (error: any) {
        console.error('Kuro Chat API error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to process chat message',
                message: error.message
            },
            { status: 500 }
        )
    }
}
