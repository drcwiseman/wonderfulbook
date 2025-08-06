// Subscription plans configuration
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  priceAmount: number; // Store as pence/cents for Stripe
  currency: string;
  period: string;
  description: string;
  bookLimit: number; // -1 for unlimited
  features: string[];
  isActive: boolean;
  stripePriceId?: string;
  displayOrder: number;
}

// Default subscription plans - can be overridden by admin settings
export const defaultSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free Trial",
    price: "£0",
    priceAmount: 0,
    currency: "GBP",
    period: "forever",
    description: "Perfect for getting started",
    bookLimit: 3,
    features: [
      "Access to 3 featured books",
      "Basic reading features", 
      "Progress tracking",
      "Mobile & desktop access",
      "No credit card required"
    ],
    isActive: true,
    displayOrder: 1
  },
  {
    id: "basic",
    name: "Basic Plan",
    price: "£9.99",
    priceAmount: 999, // 999 pence
    currency: "GBP", 
    period: "per month",
    description: "Great for regular readers",
    bookLimit: 10,
    features: [
      "Access to 10 books per month",
      "All reading features",
      "Progress tracking & bookmarks", 
      "Mobile & desktop access",
      "Customer support",
      "Offline reading"
    ],
    isActive: true,
    displayOrder: 2
  },
  {
    id: "premium",
    name: "Premium Plan", 
    price: "£19.99",
    priceAmount: 1999, // 1999 pence
    currency: "GBP",
    period: "per month",
    description: "Best value for book lovers",
    bookLimit: -1, // unlimited
    features: [
      "Unlimited access to all books",
      "All premium features",
      "Advanced analytics",
      "Priority customer support", 
      "Exclusive early access",
      "Download for offline reading",
      "Multi-device sync",
      "Ad-free experience"
    ],
    isActive: true,
    displayOrder: 3
  }
];