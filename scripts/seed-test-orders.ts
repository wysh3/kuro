import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  Timestamp,
  Firestore,
} from 'firebase/firestore'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

if (!firebaseConfig.projectId) {
  console.error('❌ Firebase config not found. Please check your .env.local file.')
  process.exit(1)
}

let app: FirebaseApp
let db: Firestore

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }
  db = getFirestore(app)
  console.log('✅ Firebase initialized successfully')
} catch (error) {
  console.error('❌ Firebase initialization error:', error)
  process.exit(1)
}

const testOrders = [
  {
    description: 'Single Biryani Order',
    items: [{ name: 'Veg Biryani', quantity: 1, price: 199, id: 'test1', preparationTime: 20 }],
    status: 'kitchen_received' as const,
    userId: 'test-user-1',
    customerName: 'Test Customer 1',
    razorpayPaymentId: 'pay_test_1',
    razorpayOrderId: 'order_test_1',
    paymentVerified: true,
    paidAt: Timestamp.now(),
    total: 199
  },
  {
    description: 'Bulk Same Item Order (10 Biryani)',
    items: [{ name: 'Veg Biryani', quantity: 10, price: 1990, id: 'test2', preparationTime: 20 }],
    status: 'kitchen_received' as const,
    userId: 'test-user-2',
    customerName: 'Test Customer 2',
    razorpayPaymentId: 'pay_test_2',
    razorpayOrderId: 'order_test_2',
    paymentVerified: true,
    paidAt: Timestamp.now(),
    total: 1990
  },
  {
    description: 'Complex Multi-Station Order',
    items: [
      { name: 'Margherita Pizza', quantity: 2, price: 598, id: 'test3', preparationTime: 15 },
      { name: 'Paneer Tikka', quantity: 2, price: 498, id: 'test4', preparationTime: 12 },
      { name: 'Butter Naan', quantity: 4, price: 196, id: 'test5', preparationTime: 5 },
      { name: 'Coke 250ml', quantity: 3, price: 120, id: 'test6', preparationTime: 1 }
    ],
    status: 'kitchen_received' as const,
    userId: 'test-user-3',
    customerName: 'Test Customer 3',
    razorpayPaymentId: 'pay_test_3',
    razorpayOrderId: 'order_test_3',
    paymentVerified: true,
    paidAt: Timestamp.now(),
    total: 1412
  },
  {
    description: 'Simple Beverages Order',
    items: [{ name: 'Coke 250ml', quantity: 5, price: 200, id: 'test7', preparationTime: 1 }],
    status: 'kitchen_received' as const,
    userId: 'test-user-4',
    customerName: 'Test Customer 4',
    razorpayPaymentId: 'pay_test_4',
    razorpayOrderId: 'order_test_4',
    paymentVerified: true,
    paidAt: Timestamp.now(),
    total: 200
  },
  {
    description: 'Bread Order',
    items: [{ name: 'Butter Naan', quantity: 8, price: 392, id: 'test8', preparationTime: 5 }],
    status: 'kitchen_received' as const,
    userId: 'test-user-5',
    customerName: 'Test Customer 5',
    razorpayPaymentId: 'pay_test_5',
    razorpayOrderId: 'order_test_5',
    paymentVerified: true,
    paidAt: Timestamp.now(),
    total: 392
  },
  {
    description: 'Pizza Order',
    items: [
      { name: 'Margherita Pizza', quantity: 3, price: 897, id: 'test9', preparationTime: 15 },
      { name: 'Coke 250ml', quantity: 2, price: 80, id: 'test10', preparationTime: 1 }
    ],
    status: 'kitchen_received' as const,
    userId: 'test-user-6',
    customerName: 'Test Customer 6',
    razorpayPaymentId: 'pay_test_6',
    razorpayOrderId: 'order_test_6',
    paymentVerified: true,
    paidAt: Timestamp.now(),
    total: 977
  }
]

async function seedTestOrders() {
  console.log('🧪 Seeding test orders for crowd intelligence testing...\n')

  try {
    for (const order of testOrders) {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...order,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      console.log(`  ✅ Added: ${order.description} (ID: ${docRef.id})`)
    }

    console.log('\n✅ Test orders seeded successfully!')
    console.log('\n📊 Orders Created:')
    testOrders.forEach(order => {
      console.log(`  - ${order.description}`)
      console.log(`    Items: ${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}`)
      console.log(`    Status: ${order.status}`)
      console.log(`    Total: ₹${order.total}`)
    })

    console.log('\n🔍 Expected Behavior:')
    console.log('  - Order 1: Should show LOW crowd (simple order)')
    console.log('  - Order 2: Should show HIGH crowd (bulk order, batch efficiency applied)')
    console.log('  - Order 3: Should show MEDIUM/HIGH crowd (complex multi-station order)')
    console.log('  - Orders 4-6: Should show varying crowd levels based on station load')
    console.log('  - Batch cooking should save ~34% time on bulk orders')
    console.log('  - Station queues should show per-station wait times')
    console.log('\n💡 Open customer page and kitchen page to verify:')
    console.log('  1. Crowd status card displays correctly')
    console.log('  2. Wait time is accurate')
    console.log('  3. Active orders count matches')
    console.log('  4. Real-time updates work when order status changes')
    console.log('  5. Manual override works from kitchen page')
    console.log('\n🚀 Ready to test!')

  } catch (error) {
    console.error('\n❌ Error seeding test orders:', error)
    console.error('\n🔒 Note: If you see PERMISSION_DENIED error, it means:')
    console.error('   1. You need to be authenticated (logged in to Firebase Console)')
    console.error('   2. Or update Firestore rules to allow writes for testing')
    console.error('   3. Or use Firebase Auth in the seed script')
    console.error('\n💡 Quick fix: Create orders manually through the app instead!')
    process.exit(1)
  }
}

seedTestOrders()
