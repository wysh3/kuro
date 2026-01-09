import Razorpay from 'razorpay'

let razorpayInstance: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    console.log('🔍 Razorpay config check:', {
      hasKeyId: !!keyId,
      hasKeySecret: !!keySecret,
      keyIdPrefix: keyId ? keyId.substring(0, 10) + '...' : 'missing'
    })

    if (!keyId || !keySecret) {
      throw new Error(`Razorpay credentials not found. keyId: ${!!keyId}, keySecret: ${!!keySecret}`)
    }

    try {
      razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      })
      console.log('✅ Razorpay initialized successfully')
    } catch (error) {
      console.error('❌ Razorpay initialization error:', error)
      throw new Error('Failed to initialize Razorpay. Please check your credentials.')
    }
  }

  return razorpayInstance
}

export function getRazorpayKeyId(): string {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  if (!keyId) {
    throw new Error('NEXT_PUBLIC_RAZORPAY_KEY_ID not found in environment variables')
  }
  return keyId
}
