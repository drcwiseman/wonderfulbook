import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";
import { eq } from "drizzle-orm";

const defaultPlans = [
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
    priceAmount: 999,
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
    priceAmount: 1999,
    currency: "GBP",
    period: "per month",
    description: "Best value for book lovers",
    bookLimit: -1,
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

export async function initializeSubscriptionPlans() {
  try {
    // Check if plans exist
    const existingPlans = await db.select().from(subscriptionPlans);
    
    if (existingPlans.length === 0) {
      console.log('Initializing subscription plans...');
      
      for (const plan of defaultPlans) {
        await db.insert(subscriptionPlans).values(plan);
        console.log(`Created plan: ${plan.name}`);
      }
      
      console.log('Default subscription plans initialized!');
      return { success: true, message: 'Plans initialized' };
    } else {
      console.log(`${existingPlans.length} subscription plans already exist`);
      return { success: true, message: 'Plans already exist' };
    }
  } catch (error) {
    console.error('Error initializing plans:', error);
    return { success: false, error: error };
  }
}

// Run if called directly
if (import.meta.url === new URL(import.meta.resolve('./init-subscription-plans.ts'))) {
  initializeSubscriptionPlans().then(result => {
    console.log(result);
    process.exit(result.success ? 0 : 1);
  });
}