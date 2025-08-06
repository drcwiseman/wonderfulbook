// Quick script to initialize default subscription plans
const { Pool } = require('@neondatabase/serverless');
const ws = require("ws");

// Configure neon
const neonConfig = { webSocketConstructor: ws };

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const defaultPlans = [
  {
    id: "free",
    name: "Free Trial",
    price: "£0",
    price_amount: 0,
    currency: "GBP",
    period: "forever",
    description: "Perfect for getting started",
    book_limit: 3,
    features: JSON.stringify([
      "Access to 3 featured books",
      "Basic reading features", 
      "Progress tracking",
      "Mobile & desktop access",
      "No credit card required"
    ]),
    is_active: true,
    display_order: 1
  },
  {
    id: "basic",
    name: "Basic Plan",
    price: "£9.99",
    price_amount: 999,
    currency: "GBP", 
    period: "per month",
    description: "Great for regular readers",
    book_limit: 10,
    features: JSON.stringify([
      "Access to 10 books per month",
      "All reading features",
      "Progress tracking & bookmarks", 
      "Mobile & desktop access",
      "Customer support",
      "Offline reading"
    ]),
    is_active: true,
    display_order: 2
  },
  {
    id: "premium",
    name: "Premium Plan", 
    price: "£19.99",
    price_amount: 1999,
    currency: "GBP",
    period: "per month",
    description: "Best value for book lovers",
    book_limit: -1,
    features: JSON.stringify([
      "Unlimited access to all books",
      "All premium features",
      "Advanced analytics",
      "Priority customer support", 
      "Exclusive early access",
      "Download for offline reading",
      "Multi-device sync",
      "Ad-free experience"
    ]),
    is_active: true,
    display_order: 3
  }
];

async function initPlans() {
  try {
    // Check if plans exist
    const result = await pool.query('SELECT COUNT(*) FROM subscription_plans');
    const count = parseInt(result.rows[0].count);
    
    if (count === 0) {
      console.log('Initializing subscription plans...');
      
      for (const plan of defaultPlans) {
        const query = `
          INSERT INTO subscription_plans (
            id, name, price, price_amount, currency, period, description, 
            book_limit, features, is_active, display_order, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        `;
        
        await pool.query(query, [
          plan.id, plan.name, plan.price, plan.price_amount, plan.currency,
          plan.period, plan.description, plan.book_limit, plan.features,
          plan.is_active, plan.display_order
        ]);
        
        console.log(`Created plan: ${plan.name}`);
      }
      
      console.log('Default subscription plans initialized!');
    } else {
      console.log(`${count} subscription plans already exist`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

initPlans();