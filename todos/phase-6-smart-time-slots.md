# Phase 6: Smart Time Slots & Behavioral Economics

**Goal**: Reduce rush hour congestion through incentives (off-peak discounts).

## 📋 Implementation Checklist

### **Task 1: Core Logic** ⏱️ 30 mins
- [x] Create `lib/time-slots.ts`
- [x] Define `TimeSlot` interface
- [x] Implement `generateTimeSlots` function
- [x] Add off-peak detection logic (11-12 AM, 2-4 PM)
- [x] Add rush hour logic (12-1 PM, 5-6 PM)
- [x] Calculate dynamic discounts (10% for off-peak)
- [x] Format time strings for display

### **Task 2: Time Slot UI Component** ⏱️ 45 mins
- [x] Create `components/customer/time-slot-selector.tsx`
- [x] Design horizontal scrollable list or grid
- [x] Create `TimeSlotCard` sub-component
- [x] Add visual badges:
    - 🟢 "Save 10%" (Off-peak)
    - 🟡 "Rush Hour" (Warning)
    - ⭐ "Recommended" (Best value)
- [x] Implement selection state
- [x] Add animations for selection

### **Task 3: Cart Integration** ⏱️ 45 mins
- [x] Update `CartContext` in `contexts/cart-context.tsx`
- [x] Add `selectedTimeSlot` to context state
- [x] Add `discountAmount` calculation
- [x] Persist time slot selection
- [x] Update `useCart` hook to expose new values

### **Task 4: Checkout UI Updates** ⏱️ 45 mins
- [x] Update `components/customer/order-summary.tsx` (or created new Checkout page)
- [x] Add `TimeSlotSelector` to the checkout flow
- [x] Display discount line item in price breakdown
- [x] Show total savings
- [x] Validate time slot selection before order placement

### **Task 5: Order Submission** ⏱️ 30 mins
- [x] Update `createOrder` logic (in `OrderService` or hook)
- [x] Include `pickupTime` and `discountApplied` in Firestore order document
- [x] Verify order structure matches constraints

### **Task 6: Testing & Polish** ⏱️ 30 mins
- [x] Verify time slot generation matches current time
- [x] Test selection interaction
- [x] Verify discount calculation in cart
- [x] Test persistence on reload
- [x] Check mobile responsiveness

## 📦 Deliverables
- [x] Smart time slot generation logic
- [x] Interactive Time Slot Selector component
- [x] Cart integration with discounts
- [x] Updated Checkout flow
