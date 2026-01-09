import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { PaymentVerifyRequest, PaymentVerifyResponse } from '@/lib/razorpay/types'

export async function POST(request: NextRequest) {
  try {
    const body: PaymentVerifyRequest = await request.json()
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing required payment details' },
        { status: 400 }
      )
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keySecret) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      )
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const isValid = generatedSignature === razorpay_signature

    const response: PaymentVerifyResponse = {
      success: isValid,
      message: isValid ? 'Payment verified successfully' : 'Invalid payment signature',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to verify payment',
      },
      { status: 500 }
    )
  }
}
