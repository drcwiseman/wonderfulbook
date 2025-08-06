import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";
import { defaultSubscriptionPlans } from "@shared/subscription-plans";
import { eq } from "drizzle-orm";

export async function initializeSubscriptionPlans() {
  try {
    console.log("Initializing subscription plans...");
    
    // Check if plans already exist
    const existingPlans = await db.select().from(subscriptionPlans);
    
    if (existingPlans.length === 0) {
      // Insert default plans
      for (const plan of defaultSubscriptionPlans) {
        await db.insert(subscriptionPlans).values(plan);
        console.log(`Created subscription plan: ${plan.name}`);
      }
      console.log("Default subscription plans initialized successfully");
    } else {
      console.log(`${existingPlans.length} subscription plans already exist`);
    }
  } catch (error) {
    console.error("Error initializing subscription plans:", error);
  }
}