import { NextRequest, NextResponse } from 'next/server'
import { getRazorpay } from '@/lib/razorpay/config'
import { RazorpayOrderRequest, RazorpayOrderResponse } from '@/lib/razorpay/types'



export async function POST(request: NextRequest) {
  console.log('🔄 API called: /api/payment/create-order')
  console.log('🔍 Env vars check:')
  console.log('  NEXT_PUBLIC_RAZORPAY_KEY_ID:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'set' : 'missing')
  console.log('  RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'set' : 'missing')

  let body: RazorpayOrderRequest = { amount: 0, receipt: '' };

  try {
    body = await request.json()
    const { amount, currency = 'INR', receipt, notes } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!receipt) {
      return NextResponse.json(
        { success: false, message: 'Receipt ID is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Creating Razorpay order:', { amount, currency, receipt })

    // explicit check for production readiness
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay credentials missing in environment variables');
      return NextResponse.json(
        { success: false, message: 'Server configuration error: Payment credentials missing' },
        { status: 500 }
      )
    }

    const razorpay = getRazorpay()

    const options = {
      amount: Math.round(amount * 100), // Ensure integer (paise)
      currency,
      receipt,
      notes,
    }

    console.log('📤 Sending request to Razorpay...')

    const razorpayOrder = await razorpay.orders.create(options)

    console.log('✅ Razorpay order created:', razorpayOrder.id)

    const order: RazorpayOrderResponse = {
      id: razorpayOrder.id,
      entity: razorpayOrder.entity,
      amount: Number(razorpayOrder.amount),
      currency: razorpayOrder.currency || 'INR',
      receipt: razorpayOrder.receipt || receipt,
      status: razorpayOrder.status,
      created_at: razorpayOrder.created_at || Date.now(),
    }

    return NextResponse.json({
      success: true,
      order,
    })
  } catch (error) {
    console.error('Error creating Razorpay order:', error)

    // Return specific error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Failed to create payment order';

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}
