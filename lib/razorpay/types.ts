export interface RazorpayOrderRequest {
  amount: number
  currency?: string
  receipt: string
  notes?: Record<string, string>
}

export interface RazorpayOrderResponse {
  id: string
  entity: string
  amount: number
  currency: string
  receipt: string
  status: string
  created_at: number
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export interface RazorpayCheckoutOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
    method?: string
  }
  theme?: {
    color: string
  }
  handler: (response: RazorpayPaymentResponse) => void
  modal?: {
    ondismiss: () => void
  }
}

export interface PaymentVerifyRequest {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export interface PaymentVerifyResponse {
  success: boolean
  message: string
}
