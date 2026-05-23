# Plans & Features – Implementation Overview

This document describes how the **subscription plans** and **feature gating** work across the codebase: data model, backend enforcement, frontend gating, and public page behavior.

---

## 1. What the Project Is

- **Product**: A **menu app** (قوائم ذكية) for restaurants/cafes: admins create menu lists and items, customize theme/logo/background, and optionally accept **website orders**, **WhatsApp orders**, and **table orders** (QR).
- **Users**: Two roles:
  - **Admin**: Owner of a “store”; manages lists, items, settings, orders, and employees. Logs in at `/login` (admin flow).
  - **Employee**: Belongs to one admin; can be **delivery** and/or **waiter**. Logs in at `/login` (employee flow). Can view/update orders (delivery orders or table orders) according to admin settings.
- **Public page**: `/menu/[username]` – customers see the admin’s menu and can place **website orders** or **table orders** (and use WhatsApp link) depending on plan and admin toggles.
- **Dashboard**: `/admin` – single app for both admin and employee; tabs and actions depend on role and **plan**.

Plans are the main way features are enabled/disabled and limits are applied.

---

## 2. Plan Tiers and Data Model

### 2.1 Plan Levels

| Plan      | Level (numeric) | Price (UI) | Role |
|-----------|-----------------|------------|------|
| `free`    | 0               | 0          | Default for new accounts; limited features and limits |
| `basic`   | 1               | 99 ج.م/شهر | Website orders, delivery employees, unlimited items, 15 employees max |
| `pro`     | 2               | 149 ج.م/شهر | Table orders, waiters, 25 employees, Ad Generator, etc. |
| `business`| 3               | 199 ج.م/شهر | Up to 50 employees, support, etc. |

Hierarchy: `free < basic < pro < business`. A higher plan includes all lower-plan features.

### 2.2 Admin Model (lib/db.ts)

```ts
plan: 'free' | 'basic' | 'pro' | 'business';
subscriptionEndsAt?: string;  // ISO date – if missing or past, treated as inactive
```

- **Active plan** = `plan` is not `free` **and** `subscriptionEndsAt >= now`.
- All plan checks in the app use this: either `plan === 'free'` or expired → no paid features.

### 2.3 Feature ↔ Plan Mapping

| Feature | Min plan | Admin flags / behavior |
|--------|----------|-------------------------|
| Unlimited menu items (no 15 cap) | basic | Free: max 15 items; paid: no cap |
| Website orders (استقبال الطلبات من الموقع) | basic | `isAcceptingOrders` |
| Delivery employees (عمال التوصيل) | basic | `enableDeliveryEmployees` |
| Delivery employee count | basic: 15, pro: 25, business: 50 | Enforced in API |
| Table orders (طلبات الطاولة) | pro | `isAcceptingTableOrders` |
| Waiters (الندلاء) | pro | `enableWaiters` |
| Item images (add/use imageUrl) | basic | UI only: hide upload if !basic |

When plan is inactive (free or expired), the backend **auto-disables** the relevant flags (see below).

---

## 3. Backend: Plan Checks and Enforcement

### 3.1 Central Helper: `checkPlanAndAutoDisable` (lib/db.ts)

- **Purpose**: (1) Decide if the admin’s plan is active at a given level; (2) if not, turn off plan-gated features and persist.
- **Usage**: Many API routes load the admin, then call `checkPlanAndAutoDisable(admin, 'basic' | 'pro' | 'business')` before allowing an action.
- **Logic**:
  - `plan === 'free'` or no `subscriptionEndsAt` or `subscriptionEndsAt < now` → plan not active.
  - If not active at **basic**: set `isAcceptingOrders = false`, `enableDeliveryEmployees = false`.
  - If not active at **pro**: set `isAcceptingTableOrders = false`, `enableWaiters = false`.
  - Writes these changes via `updateAdmin` only when something actually changes.
  - Returns `true` only if the plan is active at the **requested** level.

So: every time the public page or an employee/admin uses a plan-gated feature, the API can both **block** the request and **auto-clean** the admin’s flags if the subscription has expired.

### 3.2 Where Plan Is Enforced (APIs)

| API | Method | What is checked |
|-----|--------|------------------|
| **Public admin** `/api/public/admin/[username]` | GET | `checkPlanAndAutoDisable(admin, 'basic')`; returns updated admin so public page shows correct toggles (e.g. no website order button if inactive). |
| **Admins info** `/api/admins/[id]/info` | GET | `checkPlanAndAutoDisable(admin, 'basic')`; returns updated admin so dashboard (admin/employee) gets correct toggles on load. |
| **Orders** `/api/orders` | POST | For `orderType === 'website'`: plan basic + `isAcceptingOrders`; uses `checkPlanAndAutoDisable`. |
| **Table orders** `/api/table-orders` | POST | Plan pro + `isAcceptingTableOrders`; uses `checkPlanAndAutoDisable`. |
| **Order status** `/api/orders/[orderId]/status` | PATCH | When caller is employee: plan basic + `enableDeliveryEmployees` via `checkPlanAndAutoDisable`. |
| **Table order status** `/api/table-orders/[id]/status` | PATCH | When caller is waiter: plan pro + `enableWaiters` via `checkPlanAndAutoDisable`. |
| **Employees** `/api/employees` | POST | Active subscription (basic+); then employee **count** by plan: basic 15, pro 25, business 50. |
| **Menu item** `/api/menu` | POST | If plan not active (free/expired): block if admin already has ≥ 15 items (free cap). |
| **Admin settings** `/api/admin/settings` | PATCH | Before enabling: `enableDeliveryEmployees` → need basic; `enableWaiters` → need pro; `isAcceptingOrders` → basic; `isAcceptingTableOrders` → pro. |
| **Admin update** `/api/admins/[id]` | PUT | Same idea: cannot set `isAcceptingOrders` or `isAcceptingTableOrders` to true without the required active plan. |
| **Employee login** `/api/employees/login` | POST | `checkPlanAndAutoDisable(admin, 'basic')`; if not active, login refused (403). |

So: **creating orders (website/table), updating order status, creating employees, adding items over free limit, and enabling plan-gated toggles** are all guarded on the backend by plan (and expiry) and, where used, by `checkPlanAndAutoDisable`.

### 3.3 Limits Enforced Only in Backend

- **Menu items (free)**: Max 15 items per admin when plan is not active; enforced in `POST /api/menu`.
- **Employees**: Max 15 (basic), 25 (pro), 50 (business); enforced in `POST /api/employees`.

---

## 4. Frontend: Dashboard (Admin Page)

### 4.1 Plan Helpers (app/admin/page.tsx)

- **`isPlanActive(plan)`**  
  Uses `currentAdmin.plan` and `subscriptionEndsAt`; returns true only if subscription is not expired and plan level ≥ required level.

- **`checkPlan(featureName, plan)`**  
  If `!isPlanActive(plan)`, opens **UpgradeModal** with the feature name and required plan, and returns `false`. Used before performing a gated action (e.g. add item over 15, enable website orders, add employee).

### 4.2 How Features Are “Disabled” on the Front

1. **UI hidden or disabled**  
   Buttons/tabs for plan-gated features are not shown or are disabled when `!isPlanActive(requiredPlan)` (e.g. “الطلب عبر الموقع”, “طلبات الطاولة”, “إدارة عمال التوصيل”, “إدارة الندلاء”, item image upload).

2. **Before action: `checkPlan`**  
   For actions that need a plan (e.g. add item when at 15, enable website orders, add employee), the handler calls `checkPlan('...', 'basic'|'pro'|'business')`. If it returns false, the modal opens and the request is not sent.

3. **Auto-disable on load**  
   Revalidation of plan-gated flags happens on admin fetch (`GET /api/admins/[id]/info` runs `checkPlanAndAutoDisable`), so the dashboard receives already-correct data. A useEffect still PATCHes `/api/admin/settings` when it detects plan-inactive with flags true, as a safety net (only sends when `disableUpdates` is non-empty).

4. **Display of admin data**  
   When admin (or employee) data is loaded from `/api/admins/[id]/info`, the API now runs `checkPlanAndAutoDisable` before returning, so the response is already correct. The dashboard still normalizes booleans in the callback as a display safeguard.

### 4.3 Modals

- **UpgradeModal**: “هذه الميزة متاحة في باقة …” with links to `/payment?plan=…&mode=upgrade` (and pricing).
- **LimitReachedModal**: Used when a **limit** is hit (e.g. 15 items on free, 15/25/50 employees). Shows title/message and optional link to support.

So: on the front, only **allowed** actions are enabled and sent; the rest are either hidden or blocked with a modal. Backend still enforces plan and limits on every request.

---

## 5. Public Page (/menu/[username])

- **Data**: Fetches admin from **`GET /api/public/admin/[username]`**. That route calls `checkPlanAndAutoDisable(admin, 'basic')` and returns the (possibly updated) admin without password.
- **Behavior**:
  - Show/hide **website order** button and cart/checkout based on `admin.isAcceptingOrders` (and plan is already enforced when creating the order in `/api/orders`).
  - Show/hide **table order** flow based on `admin.isAcceptingTableOrders` (and plan enforced in `/api/table-orders`).
  - WhatsApp link is independent of plan (only `whatsappNumber` and optional `isAcceptingOrdersViaWhatsapp`).

So the public page only **offers** features that the backend will accept; the backend still rejects invalid or expired-plan requests.

### 5.1 Was “Admins info” not calling `checkPlanAndAutoDisable` a problem?

**Short answer: not a security bug, but a design inconsistency; it’s now fixed.**

- **Before**: `GET /api/admins/[id]/info` (used by the dashboard when admin or employee loads) returned the admin **as stored in the DB**, without running `checkPlanAndAutoDisable`. So if the plan had expired, the API could still return `isAcceptingOrders: true`, `enableWaiters: true`, etc. The dashboard then:
  1. **Normalized for display** (e.g. forced those toggles to false when plan inactive), and  
  2. Ran a **useEffect** that PATCHed `/api/admin/settings` to turn those flags off, so the DB was corrected when the dashboard was opened.

- **Why it wasn’t a critical bug**: Order and employee APIs always call `checkPlanAndAutoDisable` (or equivalent checks), so expired users could not actually place or update orders. The public page uses `/api/public/admin/[username]`, which does run `checkPlanAndAutoDisable`, so the public menu and ordering stayed correct. The only downside was:
  - **Two places** applying “auto-disable” (dashboard useEffect vs. public/order APIs).
  - **Stale DB** until either the dashboard was opened (useEffect PATCH) or the public/order path ran. If the admin never opened the dashboard and no one hit the public page, flags could stay true until the next relevant request.

- **Change made**: `GET /api/admins/[id]/info` now calls `checkPlanAndAutoDisable(admin, 'basic')`, then re-reads the admin and returns the updated data. So:
  - **Single source of truth**: Whenever admin data is read (dashboard or any future client), the DB is normalized and the response reflects the current plan state.
  - The dashboard receives correct toggles on first load. The dashboard still has a useEffect that PATCHes `/api/admin/settings` when it detects plan-inactive + flags true; it only runs when needed (`disableUpdates` non-empty) and is kept as a safety net.

---

## 6. Registration, Payment, and Plan Assignment

- **Register** (`/api/register`): Accepts `plan` in body but **always** creates the admin with `plan: 'free'`. So the selected plan at registration is **not** persisted; upgrade is expected to happen via payment flow.
- **Pricing** (`/pricing`): Shows free, basic, pro, business. Links:
  - New users: `/register?plan=…` or “ابدأ مجاناً”.
  - Upgrade: `/payment?plan=…&mode=upgrade`.
- **Payment** (`/payment`): Page shows plan name/price and WhatsApp instructions; there is **no** API that sets `plan` or `subscriptionEndsAt` after payment. So plan/expiry are currently updated **outside** this app (e.g. manually or by another backend that calls DB/API).

So: **plans are the core of feature gating**; the app enforces them in backend and frontend and auto-disables when expired. The only missing piece in-code is **persisting** the chosen plan after payment (e.g. an endpoint or script that sets `plan` and `subscriptionEndsAt` on the admin).

---

## 7. Summary Table: Plan Gates

| Area | Free | Basic | Pro | Business |
|------|------|-------|-----|----------|
| Menu items | Max 15 | Unlimited | Unlimited | Unlimited |
| Website orders | ❌ | ✅ (toggle) | ✅ | ✅ |
| Delivery employees | ❌ | ✅ (toggle, max 15) | ✅ (max 25) | ✅ (max 50) |
| Table orders | ❌ | ❌ | ✅ (toggle) | ✅ |
| Waiters | ❌ | ❌ | ✅ (toggle) | ✅ |
| Item images | ❌ (UI) | ✅ | ✅ | ✅ |
| Employee login | ❌ (403) | ✅ | ✅ | ✅ |

- **Backend**: Plan and expiry checked in the APIs listed above; `checkPlanAndAutoDisable` used where relevant; limits enforced on items (free) and employees (per plan).
- **Frontend**: `isPlanActive` / `checkPlan` and conditional UI/modals ensure only allowed features are shown and requested.
- **Public page**: Uses admin from `/api/public/admin/[username]` (after auto-disable); ordering and table orders are both gated by plan on the server.
- **Dashboard admin data**: `GET /api/admins/[id]/info` now also runs `checkPlanAndAutoDisable` before returning, so dashboard and public stay consistent with the same logic.

This is how the idea is implemented: **plans** control what is allowed and what is disabled when the plan expires, on both front and back.
