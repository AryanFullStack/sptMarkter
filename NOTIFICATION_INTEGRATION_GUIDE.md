# Quick Integration Guide - Notification Triggers

This guide shows how to add notification triggers to your existing actions.

## ✅ Already Implemented

The following notifications are **fully working**:
- User approved
- User role updated
- Payment recorded (admin actions)
- Order status updated

## 🛠️ Helper Functions Created

I've created reusable notification trigger functions in `src/lib/notification-triggers.ts`:

### Available Functions

```typescript
// Order created - call this after creating an order
await notifyOrderCreated(orderId, clientId, salesmanId, orderNumber, totalAmount);

// Payment due soon - call this when checking due dates
await notifyPaymentDueSoon(orderId, clientId, dueDate, pendingAmount);

// Payment overdue - call this when payment is past due
await notifyPaymentOverdue(orderId, clientId, pendingAmount);

// Pending limit exceeded - call when client exceeds their limit
await notifyPendingLimitExceeded(clientId, currentPending, limit);

// Pending limit warning - call at 80% threshold
await notifyPendingLimitWarning(clientId, currentPending, limit);
```

## 📝 How to Add to Your Actions

### Example 1: Order Creation (Salesman Actions)

In `src/app/actions/salesman-actions.ts`, after creating the order:

```typescript
// At the end of createOrderForClient function, before return
try {
  const { notifyOrderCreated } = await import("@/lib/notification-triggers");
  await notifyOrderCreated(order.id, clientId, user.id, orderNumber, totalAmount);
} catch (error) {
  console.error("Notification error:", error);
}

return { success: true, order };
```

### Example 2: Limit Checking

In `canCreateOrder` function, when limit is exceeded:

```typescript
if (totalPendingAfterOrder > pendingLimit) {
  // Send notification
  try {
    const { notifyPendingLimitExceeded } = await import("@/lib/notification-triggers");
    await notifyPendingLimitExceeded(clientId, totalPendingAfterOrder, pendingLimit);
  } catch (error) {
    console.error("Notification error:", error);
  }
  
  return { valid: false, error: "..." };
}
```

### Example 3: Payment Due Date

Create a scheduled job or check in dashboard load:

```typescript
// In a cron job or scheduled task
const overdueOrders = await getOverdueOrders();

for (const order of overdueOrders) {
  const { notifyPaymentOverdue } = await import("@/lib/notification-triggers");
  await notifyPaymentOverdue(order.id, order.user_id, order.pending_amount);
}
```

## 🎯 Quick Wins - Easy Integrations

### 1. Salesman Assignment Notification

When assigning salesman in `assignShopToSalesman`:

```typescript
// After successful assignment
const { data: salesmanData } = await supabase
  .from("users")
  .select("full_name, email")
  .eq("id", salesmanId)
  .single();

await createNotification({
  user_id: salesmanId,
  title: "New Shop Assigned",
  message: `You have been assigned to new client`,
  event_type: "salesman_assigned",
  related_user_id: shopId,
});
```

### 2. Deal/Discount Applied

When applying a coupon/deal:

```typescript
await createNotification({
  user_id: userId,
  title: "Discount Applied",
  message: `${discountPercent}% discount applied to your order`,
  event_type: "discount_applied",
  related_order_id: orderId,
});
```

## 🔧 Pattern to Follow

For any new notification:

1. Import the notification service:
```typescript
import { createNotification, notifyAdmins } from "@/lib/notification-service";
```

2. Add the notification call (use try-catch to prevent blocking):
```typescript
try {
  await createNotification({
    user_id: targetUserId,
    title: "Your Title",
    message: "Your message with Rs. ${amount}",
    event_type: "your_event_type", // Must match enum in types
    related_order_id: orderId, // Optional
  });
} catch (error) {
  console.error("Notification error:", error);
}
```

3. Done! The notification will appear in real-time.

## 📍 Where to Add Triggers

| Action | File | Function | Trigger Point |
|--------|------|----------|---------------|
| Order Created | `salesman-actions.ts` | `createOrderForClient` | After order insert (line ~640) |
| Payment Recorded | `salesman-actions.ts` | `recordPartialPayment` | After payment insert (line ~760) |
| Limit Exceeded | `salesman-actions.ts` | `canCreateOrder` | When validation fails (line ~395) |
| Salesman Assigned | `salesman-actions.ts` | `assignShopToSalesman` | After assignment (line ~145) |
| Deal Applied | `cart/checkout` | Apply coupon logic | After coupon application |

## ✅ Testing

After adding triggers:
1. Perform the action (e.g., approve a user, create order)
2. Check the notifications table in Supabase
3. Login as the target user - notification should appear instantly
4. Check bell icon badge is updated

## 🚀 Next Steps

The foundation is complete! You can now:
1. Add the quick integration snippets above
2. Test each notification type
3. Customize messages as needed
4. Add more event types in `notifications.ts` if needed

All the heavy lifting (database, Realtime, UI components) is done. Adding new notifications is just a few lines of code! 🎉
