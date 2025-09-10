# 💳 Razorpay Payment Integration Setup

This document explains how to set up the Razorpay payment integration for PrepVista.

## 🔧 Environment Variables

Add the following environment variables to your `.env.local` file in the frontend directory:

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID="your_razorpay_key_id_here"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret_here"
NEXT_PUBLIC_RAZORPAY_KEY_ID="your_razorpay_key_id_here"
```

## 🚀 Getting Razorpay Credentials

1. **Sign up for Razorpay:**

   - Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Create an account or sign in

2. **Get API Keys:**

   - Go to Settings → API Keys
   - Generate new API keys
   - Copy the Key ID and Key Secret

3. **Configure Webhook (Optional):**
   - Go to Settings → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/payment/webhook`
   - Select events: `payment.captured`, `payment.failed`

## 📊 Database Migration

Run the following commands to update your database schema:

```bash
cd frontend
npx prisma db push
```

## 🎯 Features Implemented

### ✅ Payment System

- **Free Trial**: Users get one free practice session
- **Subscription Plans**: Monthly (₹9.99) and Yearly (₹99.99) plans
- **Payment Verification**: Secure payment verification using Razorpay signatures
- **Subscription Tracking**: Track user subscription status and trial usage

### ✅ UI Components

- **PaymentModal**: Beautiful payment interface with plan selection
- **SubscriptionStatus**: Display current subscription status
- **PaymentGuard**: Protects practice sessions based on payment status

### ✅ API Endpoints

- `POST /api/payment/create-order` - Create Razorpay payment order
- `POST /api/payment/verify` - Verify payment and activate subscription
- `GET /api/payment/subscription-status` - Get user subscription status

### ✅ Database Schema

- Added payment-related fields to User model
- Created Payment model for transaction tracking
- Added PaymentStatus enum for payment states

## 🔄 How It Works

1. **New User Flow:**

   - User can start their first practice session for free
   - After completion, trial is marked as used
   - Subsequent sessions require subscription

2. **Payment Flow:**

   - User selects a plan (Monthly/Yearly)
   - Razorpay payment modal opens
   - Payment is processed and verified
   - Subscription is activated immediately

3. **Practice Session Protection:**
   - All practice sessions check subscription status
   - Users without active subscription are prompted to pay
   - Payment modal is shown for easy subscription

## 🛠️ Testing

### Test Mode

- Use Razorpay test mode for development
- Test cards: 4111 1111 1111 1111 (Visa)
- Test UPI: Use any UPI ID in test mode

### Production

- Switch to live mode in Razorpay dashboard
- Update environment variables with live keys
- Test with real payment methods

## 📱 Payment Methods Supported

- Credit/Debit Cards
- UPI (Unified Payments Interface)
- Net Banking
- Wallets (Paytm, PhonePe, etc.)
- EMI options

## 🔒 Security Features

- Payment signature verification
- Secure API key storage
- HTTPS required for production
- Webhook verification (recommended)

## 🚨 Important Notes

1. **Environment Variables**: Never commit real API keys to version control
2. **HTTPS**: Razorpay requires HTTPS in production
3. **Webhooks**: Set up webhooks for production to handle payment events
4. **Testing**: Always test payment flow thoroughly before going live

## 📞 Support

For Razorpay-related issues:

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Support](https://razorpay.com/support/)

For PrepVista integration issues:

- Check the console for error messages
- Verify environment variables are set correctly
- Ensure database migration is complete
