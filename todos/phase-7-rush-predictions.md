# Phase 7: ML Rush Hour Predictions

## Goal
Predict rush hours using historical patterns and warn users to reduce congestion.

## Checklist
- [x] Create `lib/rush-predictor.ts` with prediction logic
  - [x] Implement `predictRushHours(date)` function
  - [x] Define `RushPrediction` interface
- [x] Create `components/customer/rush-warning-banner.tsx`
  - [x] Show warning if rush hour is approaching (within 30 mins)
  - [x] Show confidence level and "Order Now" CTA
- [x] Integrate into Customer Dashboard
  - [x] Add banner to `app/customer/page.tsx`
- [x] Testing
  - [x] Verify banner appears at correct times (mock time for testing?)
