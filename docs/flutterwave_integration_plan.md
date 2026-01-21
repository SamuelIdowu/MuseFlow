# Flutterwave Subscription & Pricing Implementation Plan

This document outlines the plan to integrate Flutterwave for handling pricing tiers and user subscriptions in the AI Content Tool, replacing the previous Paystack/Stripe architecture.

---

## Recommended Pricing Model

### Pricing Tiers

| Plan | Price | Target Audience |
|------|-------|-----------------|
| **Free** | $0/month | Trial users, hobbyists |
| **Pro** | $9/month | Solo creators, freelancers |
| **Business** | $29/month | Teams, agencies |
*(Ensure your Flutterwave business is set to accept USD or international payments)*

### Feature Limits by Plan

| Feature | Free | Pro | Business |
|---------|------|-------------|-------------------|
| AI Generations | 25/month | 500/month | Unlimited |
| Brand Profiles | 2 | 10 | Unlimited |
| Saved Campaigns | 5 | Unlimited | Unlimited |
| Canvas Sessions | 3 | Unlimited | Unlimited |
| Scheduled Posts | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

### Flutterwave Plan IDs (To Be Created)

After creating plans in the Flutterwave Dashboard (Payment Plans), record the unique IDs here:

| Plan | Plan Name | Price (USD) | Plan ID |
|------|-----------|-------------|---------|
| Free | Free Tier | 0 | N/A |
| Pro | Pro Monthly | $9.00 | `12345` (Example) |
| Business | Business Monthly | $29.00 | `67890` (Example) |

---

## 1. Dependencies

We will use `flutterwave-react-v3` for the frontend checkout experience and standard `axios` or `flutterwave-node-v3` for backend operations.

```bash
pnpm install axios flutterwave-react-v3 flutterwave-node-v3
# Remove: react-paystack paystack-node
```

## 2. Environment Variables

Update `.env.local` to replace Paystack keys with Flutterwave keys:

```
# Remove Paystack Keys
# Add Flutterwave Keys
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST-...
```

## 3. Database Schema Updates

We need to store Flutterwave-specific customer and subscription details.

### Option A: Extend `users` table (Recommended)
Modify the `public.users` table to replace Paystack fields with Flutterwave fields:

- `flutterwave_customer_id` (text, unique) - e.g., '1234567'
- `flutterwave_transaction_ref` (text, unique) - Reference for the active subscription transaction.
- `flutterwave_plan_id` (text) - Store the current plan ID.
- `subscription_status` (text) - e.g., 'active', 'cancelled'
- `current_period_end` (timestamptz)

### Migration Note
Rename `paystack_customer_code` -> `flutterwave_customer_id` (or create new).

## 4. Flutterwave Setup (Dashboard)

1.  **Create Plans**: Go to Flutterwave Dashboard -> Payments -> Payment Plans -> Create Plan.
    *   Name: Pro Plan, Amount: $9.00, Interval: Monthly.
    *   Name: Business Plan, Amount: $29.00, Interval: Monthly.
2.  **Get Keys**: Settings -> API -> Public Key, Secret Key, Encryption Key.
3.  **Webhooks**: Settings -> Webhooks. URL: `https://your-domain.com/api/webhooks/flutterwave`. Secret Hash: `your_secret_hash`.

## 5. Backend Implementation

### A. Initialization
We can use `flutterwave-node-v3` or direct API calls.

### B. API Routes

1.  **Initialize Transaction** (`src/app/api/flutterwave/initialize/route.ts`)
    *   *Optional*: Flutterwave frontend SDK can handle initialization directly. Backend is needed if we want to create the transaction server-side or mask keys (though Public Key is safe for client).
    *   Ideally, use frontend SDK to initiate, and verify on backend.

2.  **Verify Transaction** (`src/app/api/flutterwave/verify/route.ts`)
    *   Accepts `transaction_id` (or `status`, `tx_ref`).
    *   Calls Flutterwave `transactions/verify/:id`.
    *   Confirms status is 'successful'.
    *   Updates user subscription in DB if successful.

3.  **Manage Subscription** (`src/app/api/flutterwave/manage/route.ts`)
    *   **Cancel**: Endpoint to cancel a subscription.
    *   Calls Flutterwave `subscriptions/:id/cancel`.

4.  **Webhook Handler** (`src/app/api/webhooks/flutterwave/route.ts`)
    *   Verifies signature using `verif-hash` header.
    *   Handles events:
        *   `charge.completed`: Initial payment or renewal.
        *   `subscription.cancelled`: Update status.

## 6. Frontend Implementation

### A. Pricing Page
- Use `flutterwave-react-v3`'s `useFlutterwave` or `FlutterWaveButton`.
- "Subscribe" button triggers the Flutterwave Modal.
    ```typescript
    const config = {
      public_key: 'FLWPUBK_TEST-...',
      tx_ref: Date.now(),
      amount: 9,
      currency: 'USD',
      payment_options: 'card,mobilemoney,ussd',
      customer: {
        email: user.email,
        phone_number: '...',
        name: user.name,
      },
      payment_plan: '12345', // The Plan ID
      customizations: {
        title: 'AI Content Tool Pro',
        description: 'Payment for items in cart',
        logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
      },
    };
    ```
- On `callback` (success), call your `/api/flutterwave/verify` route.

### B. Subscription Management
- Show current Plan.
- "Cancel Subscription" button -> Calls your API (`/api/flutterwave/manage`) to cancel.

## 7. Implementation Steps

1.  [ ] Install `flutterwave-react-v3`, `flutterwave-node-v3`.
2.  [ ] Configure Environment Variables.
3.  [ ] Create Plans in Flutterwave Dashboard.
4.  [ ] Update Supabase Schema (Add Flutterwave columns).
5.  [ ] Implement Webhook Handler.
6.  [ ] Implement Verify/Manage API routes.
7.  [ ] Update Pricing Page to use `useFlutterwave`.
8.  [ ] Update Subscription Settings page.
9.  [ ] Test flows with Test Cards.

---

## 8. Usage Tracking

*Same as before - DB Logic remains the same.*

## 9. Upgrade/Downgrade Flow

### Upgrade
1. User selects new Plan.
2. Trigger Flutterwave payment with new Plan ID.
3. On success, update DB.

### Downgrade/Cancel
1. Cancel current subscription via API.
2. If downgrading to paid, start new subscription.

---

## 10. Testing Strategy

### Flutterwave Test Cards
- Use Flutterwave test card details provided in their documentation.
- Test successful payment.
- Test failed payment.

### Checklist
- [ ] Subscribe to Pro -> Webhook receives event -> DB updates.
- [ ] Cancel Subscription -> Webhook receives event -> DB updates.
- [ ] Renewal (Simulation) -> Webhook receives event -> DB updates.

