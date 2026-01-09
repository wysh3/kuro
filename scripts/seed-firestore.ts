import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  setDoc,
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

const menuItems = [
  {
    name: 'Margherita Pizza',
    category: 'Pizza',
    price: 299,
    available: true,
    prepTime: 15,
    image: '/margherita-pizza.png',
    createdAt: Timestamp.now(),
  },
  {
    name: 'Veg Biryani',
    category: 'Rice',
    price: 199,
    available: true,
    prepTime: 20,
    image: '/veg-biryani.jpg',
    createdAt: Timestamp.now(),
  },
  {
    name: 'Paneer Tikka',
    category: 'Starters',
    price: 249,
    available: true,
    prepTime: 12,
    image: '/paneer-tikka.png',
    createdAt: Timestamp.now(),
  },
  {
    name: 'Butter Naan',
    category: 'Bread',
    price: 49,
    available: true,
    prepTime: 5,
    image: '/butter-naan.png',
    createdAt: Timestamp.now(),
  },
  {
    name: 'Coke 250ml',
    category: 'Beverages',
    price: 40,
    available: true,
    prepTime: 1,
    image: '/coke-bottle.jpg',
    createdAt: Timestamp.now(),
  },
  {
    name: 'Gulab Jamun',
    category: 'Desserts',
    price: 99,
    available: true,
    prepTime: 3,
    image: '/gulab-jamun.png',
    createdAt: Timestamp.now(),
  },
]

async function seedFirestore() {
  console.log('🌱 Seeding Firestore with initial data...\n')

  try {
    // Seed menu items
    console.log('📝 Seeding menu items...')
    for (const item of menuItems) {
      const docRef = doc(collection(db, 'menu_items'))
      await setDoc(docRef, item)
      console.log(`  ✅ Added: ${item.name}`)
    }

    // Seed campus status
    console.log('\n🏫 Seeding campus status...')
    await setDoc(doc(db, 'campus_status', 'mrc'), {
      crowdLevel: 'medium',
      estimatedWaitTime: 10,
      lastUpdated: Timestamp.now(),
    })
    console.log('  ✅ Added: MRC campus status\n')

    console.log('✅ Firestore seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`  - ${menuItems.length} menu items`)
    console.log(`  - 1 campus status (MRC)`)
    console.log('\n🚀 You can now start the application!')
  } catch (error) {
    console.error('\n❌ Error seeding Firestore:', error)
    process.exit(1)
  }
}

seedFirestore()
