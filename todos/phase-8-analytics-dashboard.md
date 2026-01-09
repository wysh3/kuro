# Phase 8: Analytics Dashboard

## Goal
Build a data-driven dashboard for both students (customer side) and staff (kitchen side) to track spending, savings, and business performance.

## Checklist
- [x] **Infrastructure**
  - [x] Install `recharts` for data visualization if not already present
- [x] **Student Analytics** (File: `app/customer/profile/page.tsx`)
  - [x] Fetch user's order history from Firestore
  - [x] Calculate metrics: Total Spent, Orders Count, Money Saved, Time Saved
  - [x] Identify Favorite Items
  - [x] Implement Spending Trend chart (Recharts)
  - [x] Build a beautiful profile UI with glassmorphism preview
- [x] **Kitchen Analytics** (File: `app/kitchen/analytics/page.tsx`)
  - [x] Fetch all orders for the current day/month
  - [x] Calculate metrics: Today's Revenue, Orders Completed, Avg Prep Time
  - [x] Implement Peak Hours chart (Bar chart)
  - [x] Implement Popular Items chart (Pie/Bar chart)
  - [x] Build a sleek professional dashboard UI
- [x] **Navigation**
  - [x] Add link to Profile in Customer Header
  - [x] Add link to Analytics in Kitchen Sidebar/Header
