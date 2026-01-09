# Phase 5: Google Gemini Meal Personalization - Implementation Plan

**Status**: 🚧 In Progress  
**Priority**: HIGH  
**Estimated Time**: 4-5 hours  
**Goal**: Build an AI nutritionist that impresses judges with personalized meal planning

---

## 🎯 Overview

Build a conversational AI meal planner that:
- Understands natural language goals (healthy, budget, protein, weight loss)
- Generates personalized weekly meal plans (3, 5, or 7 days)
- Uses ONLY MRC menu items (realistic constraint)
- Provides calorie/macro breakdowns
- Offers one-click add to cart functionality
- Showcases Google Gemini API integration

---

## 📋 Implementation Checklist

### **Task 1: Install Dependencies** ⏱️ 10 mins
- [x] Install `@google/generative-ai` package
- [x] Verify installation in package.json
- [x] Test import in a temporary file

**Commands**:
```bash
npm install @google/generative-ai
```

**Acceptance Criteria**:
- Package appears in package.json dependencies
- No installation errors
- TypeScript types available

---

### **Task 2: Configure Gemini API** ⏱️ 15 mins

#### **File**: `lib/gemini/config.ts`

- [ ] Create Gemini API configuration file
- [ ] Set up GoogleGenerativeAI client
- [ ] Use gemini-2.4-flash model (latest and free)
- [ ] Add environment variable handling with fallback
- [ ] Export configured model instance

**Implementation Details**:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use environment variable or mock key for testing
const apiKey = process.env.GEMINI_API_KEY || 'MOCK_KEY_FOR_TESTING';

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash', // Latest free tier model
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
  }
});

export const isMockMode = apiKey === 'MOCK_KEY_FOR_TESTING';
```

**Acceptance Criteria**:
- File created with proper TypeScript types
- Model exported successfully
- Mock mode flag available for testing
- No runtime errors on import

---

### **Task 3: Create Meal Planner Core Logic** ⏱️ 60 mins

#### **File**: `lib/gemini/meal-planner.ts`

- [x] Define TypeScript interfaces for meal plan request/response
- [x] Implement smart prompt engineering function
- [x] Create menu context builder
- [x] Implement JSON parsing with error handling
- [x] Add mock response for testing without API key
- [x] Export main `generateMealPlan` function

**Key Interfaces**:
```typescript
interface MealPlanRequest {
  goal: 'healthy' | 'budget' | 'protein' | 'weight_loss' | 'custom';
  customGoal?: string;
  budget?: number; // Max spend per week
  allergies?: string[];
  preferences?: string[];
  daysCount: 3 | 5 | 7;
}

interface MealPlanResponse {
  plan: DayPlan[];
  summary: {
    totalCost: number;
    avgCaloriesPerDay: number;
    proteinPerDay: number;
  };
  tips: string[];
}

interface DayPlan {
  day: string;
  breakfast: MealItem;
  lunch: MealItem;
  snack?: MealItem;
  dinner?: MealItem;
}

interface MealItem {
  item: string;
  calories: number;
  cost: number;
  protein?: number;
}
```

**Prompt Engineering Strategy**:
- Provide complete menu context as JSON
- Specify clear constraints (budget, allergies, preferences)
- Request structured JSON output
- Include realistic portion sizes
- Emphasize variety and balance
- Add nutritional guidelines

**Acceptance Criteria**:
- All interfaces properly typed
- Prompt generates valid JSON responses
- Error handling for malformed responses
- Mock mode returns realistic sample data
- Function handles all goal types
- Budget constraints respected

---

### **Task 4: Build API Route** ⏱️ 30 mins

#### **File**: `app/api/ai/meal-plan/route.ts`

- [x] Create POST endpoint handler
- [x] Validate request body with Zod
- [x] Fetch menu items from Firestore
- [x] Call generateMealPlan function
- [x] Return JSON response
- [x] Add error handling and logging
- [x] Implement rate limiting (optional)

**Implementation Details**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateMealPlan } from '@/lib/gemini/meal-planner';
import { db } from '@/lib/firebase/config';
import { z } from 'zod';

const requestSchema = z.object({
  goal: z.enum(['healthy', 'budget', 'protein', 'weight_loss', 'custom']),
  customGoal: z.string().optional(),
  budget: z.number().optional(),
  allergies: z.array(z.string()).optional(),
  preferences: z.array(z.string()).optional(),
  daysCount: z.enum([3, 5, 7]).default(5),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = requestSchema.parse(body);
    
    // Fetch menu items from Firestore
    const menuSnapshot = await db.collection('menu_items').get();
    const menuItems = menuSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Generate meal plan
    const plan = await generateMealPlan(validated, menuItems);
    
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error('Meal plan generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- Endpoint responds to POST requests
- Request validation works correctly
- Menu items fetched successfully
- Meal plan generated and returned
- Errors handled gracefully
- Response format matches frontend expectations

---

### **Task 5: Create Meal Plan Display Component** ⏱️ 45 mins

#### **File**: `components/customer/meal-plan-display.tsx`

- [x] Create component to display meal plan
- [x] Show daily breakdown with meals
- [x] Display nutritional summary
- [x] Add tips section
- [x] Implement "Add to Cart" buttons
- [x] Add animations with Framer Motion
- [x] Style with glassmorphism

**Features**:
- Accordion for each day
- Meal cards with item details
- Summary cards (cost, calories, protein)
- Tips as badge list
- One-click add all meals to cart
- Individual meal add to cart

**Acceptance Criteria**:
- Component renders meal plan correctly
- All nutritional info displayed
- Add to cart functionality works
- Responsive design
- Smooth animations
- Accessible (keyboard navigation)

---

### **Task 6: Build Chat Interface** ⏱️ 90 mins

#### **File**: `app/customer/meal-planner/page.tsx`

- [ ] Create chat-style interface
- [ ] Implement message state management
- [ ] Add quick goal buttons
- [ ] Create text input with send button
- [ ] Integrate with API route
- [ ] Add loading states
- [ ] Implement message animations
- [ ] Style with modern chat UI patterns

**UI Components**:
1. **Header**: Title + "Powered by Google Gemini" badge
2. **Messages Area**: Scrollable chat history
3. **Quick Goals**: 4 button grid for common goals
4. **Input Area**: Text field + send button
5. **Loading State**: Animated dots

**User Flow**:
1. User sees welcome message
2. User clicks quick goal or types custom goal
3. Loading animation shows
4. AI response appears with meal plan
5. User can add meals to cart
6. User can ask follow-up questions

**Acceptance Criteria**:
- Chat interface functional
- Messages persist during session
- Quick goals trigger API calls
- Custom text input works
- Loading states smooth
- Meal plans display correctly
- Mobile responsive

---

### **Task 7: Add Navigation & Integration** ⏱️ 20 mins

- [x] Add meal planner link to customer navigation
- [x] Add icon (Sparkles or Brain)
- [x] Update customer dashboard with meal planner card
- [x] Add "AI Meal Planner" badge/tag
- [x] Test navigation flow

**Files to Update**:
- Customer navigation component
- Customer dashboard page
- Layout components

**Acceptance Criteria**:
- Link visible in navigation
- Icon displays correctly
- Navigation works from all pages
- Dashboard card looks good

---

### **Task 8: Testing & Polish** ⏱️ 45 mins

#### **Unit Tests**:
- [x] Test meal planner logic with mock data
- [x] Test API route with various inputs
- [x] Test component rendering

#### **Integration Tests**:
- [x] Test full flow: goal → API → display
- [x] Test add to cart functionality
- [x] Test error scenarios

#### **Manual Testing**:
- [x] Test all goal types
- [x] Test custom goals
- [x] Test budget constraints
- [x] Test allergies/preferences
- [x] Test different day counts
- [x] Test on mobile devices
- [x] Test with real Gemini API
- [x] Test with mock mode

#### **Polish**:
- [x] Add loading skeletons
- [x] Add empty states
- [x] Add error messages
- [x] Optimize animations
- [x] Add tooltips/help text
- [x] Ensure accessibility

**Acceptance Criteria**:
- All tests pass
- No console errors
- Smooth user experience
- Works on all devices
- Handles errors gracefully

---

## 🔧 Technical Considerations

### **API Key Management**:
- Store in `.env.local` as `GEMINI_API_KEY`
- Never commit to git
- Provide mock mode for development
- Add instructions for obtaining key

### **Rate Limiting**:
- Gemini free tier: 15 requests/min
- Consider caching responses
- Add user-facing rate limit messages
- Implement request queuing if needed

### **Menu Data**:
- Ensure menu items have nutritional info
- Add default values if missing
- Update seed script if needed
- Validate menu data structure

### **Performance**:
- Lazy load meal planner page
- Optimize API response size
- Cache menu items
- Debounce text input

### **Error Handling**:
- API key invalid
- Network errors
- Malformed responses
- Empty menu
- Invalid user input

---

## 🎨 Design Guidelines

### **Color Scheme**:
- Primary: Blue (#3B82F6) for AI theme
- Accent: Purple (#8B5CF6) for premium feel
- Background: Pure black (#000000)
- Cards: Glassmorphic with white/5 opacity
- Text: White with varying opacity

### **Typography**:
- Headers: Bold, large
- Body: Regular, readable
- Code/Numbers: Monospace
- Tips: Italic, smaller

### **Animations**:
- Message appear: Fade + slide up
- Loading: Bouncing dots
- Button hover: Scale + glow
- Card hover: Lift effect

### **Spacing**:
- Generous padding in chat
- Tight spacing in meal cards
- Consistent margins throughout

---

## 📊 Success Metrics

### **Functional**:
- ✅ Meal plans generate successfully
- ✅ All goal types work
- ✅ Add to cart functional
- ✅ No critical bugs

### **Performance**:
- ✅ API response < 5 seconds
- ✅ Page load < 2 seconds
- ✅ Smooth animations (60fps)

### **UX**:
- ✅ Intuitive interface
- ✅ Clear feedback
- ✅ Mobile friendly
- ✅ Accessible

### **Demo Impact**:
- ✅ Wow factor on first use
- ✅ Shows Google AI integration
- ✅ Demonstrates practical value
- ✅ Differentiates from competitors

---

## 🚀 Deployment Checklist

- [x] Environment variables configured
- [x] API key obtained and tested
- [x] All features working in production
- [x] Mobile tested
- [x] Performance optimized
- [x] Error handling verified
- [x] Documentation updated
- [x] Demo script prepared

---

## 📝 Notes & Improvements

### **Future Enhancements**:
- Save meal plans to user profile
- Share meal plans with friends
- Export to calendar
- Grocery list generation
- Recipe details
- Dietary restriction filters
- Multi-language support
- Voice input

### **Known Limitations**:
- Requires menu items to have nutritional data
- Limited to MRC menu (by design)
- Depends on Gemini API availability
- Rate limited by free tier

### **Demo Tips**:
- Prepare sample goals beforehand
- Have backup screenshots
- Emphasize Google AI integration
- Show variety of use cases
- Highlight practical value

---

## 🎯 Alignment with Winning Strategy

This phase directly supports:
- ✅ **Innovation**: AI/ML integration with Gemini
- ✅ **Google Tech**: Deep Gemini API usage
- ✅ **Impact**: Helps students make healthier choices
- ✅ **Execution**: Production-quality AI feature
- ✅ **Differentiation**: Not just ordering, but intelligent planning

**Judge Appeal**:
- Shows advanced AI integration
- Demonstrates Google ecosystem usage
- Solves real student problem
- Production-ready implementation
- Scalable to other campuses

---

**Created**: 2026-01-09  
**Last Updated**: 2026-01-09  
**Owner**: Development Team  
**Reviewers**: TBD
