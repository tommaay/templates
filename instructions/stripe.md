# Stripe Payment Integration - Project Requirements Document (PRD)

## Table of Contents

- [Stripe Payment Integration - Project Requirements Document (PRD)](#stripe-payment-integration---project-requirements-document-prd)
- [Table of Contents](#table-of-contents)
- [Important Implementation Notes (Must Read First)](#important-implementation-notes-must-read-first)
- [Introduction](#introduction)
- [Overview](#overview)
- [Requirements](#requirements)
- [Implementation Steps](#implementation-steps)
- [Important Notes](#important-notes)
- [Implementation Details](#implementation-details)
- [Security Considerations](#security-considerations)

## Important Implementation Notes (Must Read First)

### Clerk v6 Compatibility

When implementing this guide with Clerk auth, be aware of these critical changes in Clerk v6:

1. **Correct Imports**

```typescript
// Correct
import { clerkClient, clerkMiddleware, auth } from '@clerk/nextjs/server';

// Incorrect (deprecated)
import { auth } from '@clerk/nextjs';
import { authMiddleware } from '@clerk/nextjs';
```

2. **Auth Usage**

```typescript
// Correct
const { userId } = await auth();

// Incorrect (deprecated)
const { userId } = auth();
```

3. **Middleware Implementation**

```typescript
// Correct
export default clerkMiddleware(req => {
  const path = req.nextUrl?.pathname || '/';
  // ...
});

// Incorrect (deprecated)
export default authMiddleware({
  publicRoutes: ['/'],
});
```

### Common Implementation Pitfalls

1. **Client/Server Component Separation**

```typescript
// ❌ Incorrect: Mixing client interactivity in server component
// page.tsx
export default function Page() {
 return <button onClick={() => {}} />
}


// ✅ Correct: Separate client and server components
// components/interactive-button.tsx
'use client'
export function Button() {
 return <button onClick={() => {}} />
}
// page.tsx
import { Button } from './components/interactive-button'
export default function Page() {
 return <Button />
}
```

2. **URL Handling in Middleware**

```typescript
// Correct
const path = req.nextUrl?.pathname || '/';
return NextResponse.redirect(new URL('/pricing', req.nextUrl));

// Incorrect
const path = request.nextUrl.pathname; // might be undefined
return NextResponse.redirect(new URL('/pricing', request.url));
```

## Introduction

This document outlines the plan to integrate Stripe payment processing into the Reddit Analytics Platform. The goal is to allow users to upgrade from a **Free** tier to either a **Premium Monthly** or **Premium Yearly** subscription by making a payment through Stripe.

## Overview

The integration involves:

- Setting up Stripe for payment processing with multiple subscription tiers
- Updating the database schema to store payment and subscription details
- Creating a pricing page with Free, Premium Monthly, and Premium Yearly tiers
- Redirecting free users to the pricing page when they attempt to access premium content
- Handling the payment process and updating user tiers upon successful payment
- Ensuring compliance with security best practices

## Requirements

1. **Stripe Integration**

- Use Stripe to set up payment processing
- Support both monthly and yearly subscription plans
- Environment variables required:
  ```bash
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY=https://buy.stripe.com/...
  NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY=https://buy.stripe.com/...
  ```

2. **Authentication and User Data**

- Authentication is managed by **Clerk v6**
- User profiles are stored in **Supabase**
- Required environment variables:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  SUPABASE_SERVICE_KEY=your_service_key  # Note: Not SUPABASE_SERVICE_ROLE_KEY
  ```
- Database schema:
  ```sql
  CREATE TABLE profiles (
   user_id text PRIMARY KEY,
   email text NOT NULL UNIQUE,
   tier text DEFAULT 'free' CHECK (tier IN ('free', 'premium monthly', 'premium yearly')),
   stripe_customer_id text,
   stripe_subscription_id text,
   created_at timestamp with time zone DEFAULT now()
  );
  ```

## Implementation Steps

### 4. Create Pricing Page

**Implementation Requirements**

- Create a new page at `app/pricing/page.tsx` (server component)
- Create a client component for the pricing card
- Design three cards (Free, Premium Monthly, Premium Yearly)
- Use Stripe payment links for direct checkout
- Implement proper client/server component separation

**Working Example**

1. First, create the client-side pricing card component (`components/pricing-card.tsx`):

```typescript
'use client'


import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'


interface PricingCardProps {
 name: string
 price: string
 features: string[]
 paymentLink?: string
}


export function PricingCard({ name, price, features, paymentLink }: PricingCardProps) {
 return (
   <Card className='w-[300px] flex flex-col'>
     <CardHeader>
       <CardTitle className='text-2xl'>{name}</CardTitle>
       <CardDescription className='text-xl font-bold'>{price}</CardDescription>
     </CardHeader>
     <CardContent className='flex-grow'>
       <ul className='space-y-2'>
         {features.map((feature, i) => (
           <li key={i} className='flex items-center gap-2'>
             <Check className='h-4 w-4 text-primary' />
             <span>{feature}</span>
           </li>
         ))}
       </ul>
     </CardContent>
     <CardFooter>
       {paymentLink ? (
         <Button
           className='w-full'
           onClick={() => window.location.href = paymentLink}
         >
           Upgrade Now
         </Button>
       ) : null}
     </CardFooter>
   </Card>
 )
}
```

2. Then, create the server-side pricing page (`app/pricing/page.tsx`):

```typescript
import { PricingCard } from '@/components/pricing-card'


const FREE_FEATURES = [
 'View basic subreddit stats',
 'Limited daily searches',
 'Basic analytics features',
]


const PREMIUM_FEATURES = [
 'Unlimited subreddit searches',
 'Advanced analytics and insights',
 'Historical data access',
 'Export data to CSV',
 'Priority support',
]


export default function PricingPage() {
 return (
   <div className='min-h-screen bg-black text-white'>
     <main className='container mx-auto py-12'>
       <div className='text-center mb-12'>
         <h1 className='text-4xl font-bold mb-4'>Choose Your Plan</h1>
         <p className='text-xl text-gray-400'>
           Get access to advanced analytics features with our Premium plans
         </p>
       </div>


       <div className='flex flex-col md:flex-row justify-center items-center gap-8'>
         <PricingCard
           name='Free'
           price='$0'
           features={FREE_FEATURES}
         />
         <PricingCard
           name='Premium Monthly'
           price='$9.99/month'
           features={PREMIUM_FEATURES}
           paymentLink={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY}
         />
         <PricingCard
           name='Premium Yearly'
           price='$99/year'
           features={[...PREMIUM_FEATURES, '2 months free']}
           paymentLink={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY}
         />
       </div>
     </main>
   </div>
 )
}
```

### 5. Implement Access Control

**Implementation Requirements**

- Update middleware to handle multiple premium tiers
- Implement proper error handling
- Use correct Clerk v6 auth patterns
- Handle both monthly and yearly subscriptions

**Working Example**

```typescript
import { clerkClient, clerkMiddleware, auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getUserTier } from '@/lib/supabase-admin';

const publicPaths = ['/api/webhook', '/pricing', '/', '/login', '/signup'];
const premiumTiers = ['premium monthly', 'premium yearly'];

export default clerkMiddleware(req => {
  try {
    const path = req.nextUrl?.pathname || '/';
    console.log('=== MIDDLEWARE START ===');
    console.log('Request path:', path);

    // Check if it's a public route
    if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
      console.log('Public route detected, allowing access');
      return NextResponse.next();
    }

    // Check if it's a direct subreddit route (e.g., /dog)
    const subredditMatch = path.match(/^\/([^\/]+)$/);
    if (subredditMatch && !publicPaths.includes(path)) {
      console.log('Subreddit route detected:', path);

      return auth().then(({ userId }) => {
        if (!userId) {
          console.log('No userId, skipping tier check');
          return NextResponse.next();
        }

        return getUserTier(userId).then(userTier => {
          console.log('User tier:', userTier);

          if (!premiumTiers.includes(userTier)) {
            console.log('Non-premium user, redirecting to pricing');
            return NextResponse.redirect(new URL('/pricing', req.nextUrl));
          }

          console.log('Premium user, allowing access');
          return NextResponse.next();
        });
      });
    }

    console.log('=== MIDDLEWARE END ===');
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
});

export const config = {
  matcher: ['/((?!api/reddit|_next/static|_next/image|favicon.ico).*)'],
};
```

**Important Notes**

1. Always use 'use client' directive for components with interactivity
2. Keep server components for static content and data fetching
3. Use proper TypeScript interfaces for component props
4. Implement comprehensive error handling
5. Add detailed logging for debugging
6. Use environment variables for payment links
7. Validate subscription tiers against a predefined list

## Security Considerations

1. Always use environment variables for sensitive keys
2. Implement protection at both middleware and page levels
3. Handle errors gracefully and provide fallbacks
4. Log important events for debugging
5. Validate user authentication and authorization at every step
6. Validate subscription tiers against allowed values
7. Verify webhook events match expected subscription types
8. Implement proper subscription status tracking
