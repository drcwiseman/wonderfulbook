import { BookRecommendationWithDetails } from '../bookRecommendationEngine.js';

export interface BookRecommendationEmailData {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    subscriptionTier: string;
  };
  recommendations: BookRecommendationWithDetails[];
  totalBooksRead: number;
  readingGoals: number;
  unsubscribeUrl: string;
}

/**
 * Generate HTML email template for book recommendations
 */
export function generateBookRecommendationEmail(data: BookRecommendationEmailData): string {
  const { user, recommendations, totalBooksRead, readingGoals, unsubscribeUrl } = data;
  
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://wonderful-books.replit.app' 
    : 'http://localhost:5000';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📚 Your Weekly Book Recommendations - Wonderful Books</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background-color: #f8fafc;
        }
        .email-container {
            background-color: white;
            margin: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
            color: white;
            padding: 30px 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px;
        }
        .greeting {
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 24px;
            font-weight: 500;
        }
        .stats-section {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 32px;
            text-align: center;
        }
        .stats-grid {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 20px;
        }
        .stat-item {
            text-align: center;
        }
        .stat-number {
            font-size: 32px;
            font-weight: 700;
            color: #ea580c;
            display: block;
        }
        .stat-label {
            font-size: 14px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .recommendations-title {
            font-size: 24px;
            color: #1f2937;
            margin: 32px 0 24px 0;
            font-weight: 600;
        }
        .book-card {
            display: flex;
            gap: 20px;
            padding: 24px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            margin-bottom: 24px;
            transition: all 0.3s ease;
            text-decoration: none;
            color: inherit;
        }
        .book-card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateY(-2px);
        }
        .book-cover {
            flex-shrink: 0;
            width: 80px;
            height: 120px;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        .book-cover img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .book-info {
            flex: 1;
        }
        .book-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 8px 0;
            line-height: 1.3;
        }
        .book-author {
            font-size: 14px;
            color: #6b7280;
            margin: 0 0 12px 0;
        }
        .book-reason {
            font-size: 14px;
            color: #374151;
            background: #f3f4f6;
            padding: 8px 12px;
            border-radius: 6px;
            margin: 12px 0;
            border-left: 3px solid #ea580c;
        }
        .book-stats {
            display: flex;
            align-items: center;
            gap: 16px;
            margin: 12px 0;
        }
        .rating {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            color: #f59e0b;
        }
        .tier-badge {
            background: #ea580c;
            color: white;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 4px;
            text-transform: uppercase;
        }
        .tier-badge.free {
            background: #10b981;
        }
        .tier-badge.basic {
            background: #3b82f6;
        }
        .cta-section {
            text-align: center;
            padding: 32px 0;
            background: #f8fafc;
            margin: 32px -40px -40px -40px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
            transition: all 0.3s ease;
        }
        .cta-button:hover {
            box-shadow: 0 6px 20px rgba(234, 88, 12, 0.4);
            transform: translateY(-2px);
        }
        .footer {
            text-align: center;
            padding: 24px 40px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            background: #f8fafc;
        }
        .footer a {
            color: #ea580c;
            text-decoration: none;
        }
        .social-links {
            margin: 16px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 8px;
            color: #6b7280;
            text-decoration: none;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            .content {
                padding: 24px 20px;
            }
            .header {
                padding: 24px 20px;
            }
            .book-card {
                flex-direction: column;
                align-items: center;
                text-align: center;
            }
            .book-cover {
                width: 100px;
                height: 150px;
            }
            .stats-grid {
                flex-direction: column;
                gap: 16px;
            }
            .cta-section {
                margin: 32px -20px -20px -20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>📚 Your Weekly Picks</h1>
            <p>Curated just for you by our recommendation engine</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello ${user.firstName || 'Reader'}! 👋
            </div>
            
            ${totalBooksRead > 0 ? `
            <div class="stats-section">
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-number">${totalBooksRead}</span>
                        <span class="stat-label">Books Read</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${readingGoals}</span>
                        <span class="stat-label">Monthly Goal</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${recommendations.length}</span>
                        <span class="stat-label">New Picks</span>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <h2 class="recommendations-title">🎯 Picked Just for You</h2>
            
            ${recommendations.map(book => `
                <a href="${baseUrl}/book/${book.id}?utm_source=email&utm_medium=recommendation&utm_campaign=weekly_picks" class="book-card">
                    <div class="book-cover">
                        <img src="${book.coverImageUrl || `${baseUrl}/placeholder-book.jpg`}" alt="${book.title} cover" />
                    </div>
                    <div class="book-info">
                        <h3 class="book-title">${book.title}</h3>
                        <p class="book-author">by ${book.author}</p>
                        <div class="book-stats">
                            <div class="rating">
                                ⭐ ${book.rating}/5.0 (${book.totalRatings} reviews)
                            </div>
                            <span class="tier-badge ${book.requiredTier}">${book.requiredTier}</span>
                            ${book.pageCount ? `<span style="color: #6b7280; font-size: 14px;">${book.pageCount} pages</span>` : ''}
                        </div>
                        <div class="book-reason">
                            💡 ${book.reason}
                        </div>
                    </div>
                </a>
            `).join('')}
            
            <div class="cta-section">
                <a href="${baseUrl}/bookstore?utm_source=email&utm_medium=recommendation&utm_campaign=weekly_picks" class="cta-button">
                    🚀 Explore Your Library
                </a>
                <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">
                    Discover thousands more books in your personal digital library
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p>Happy reading from the Wonderful Books team! 📖</p>
            <div class="social-links">
                <a href="${baseUrl}">📚 Visit Library</a> •
                <a href="${baseUrl}/account">⚙️ Preferences</a> •
                <a href="${unsubscribeUrl}">✉️ Unsubscribe</a>
            </div>
            <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
                You're receiving this because you're subscribed to Wonderful Books recommendations.<br>
                Wonderful Books - Premium Digital Book Streaming Platform
            </p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate plain text version for email clients that don't support HTML
 */
export function generateBookRecommendationTextEmail(data: BookRecommendationEmailData): string {
  const { user, recommendations, totalBooksRead, readingGoals, unsubscribeUrl } = data;
  
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://wonderful-books.replit.app' 
    : 'http://localhost:5000';

  return `
📚 YOUR WEEKLY BOOK RECOMMENDATIONS - WONDERFUL BOOKS

Hello ${user.firstName || 'Reader'}! 👋

${totalBooksRead > 0 ? `
📊 YOUR READING PROGRESS
• Books Read: ${totalBooksRead}
• Monthly Goal: ${readingGoals}  
• New Picks: ${recommendations.length}

` : ''}🎯 PICKED JUST FOR YOU

${recommendations.map(book => `
📖 ${book.title}
👤 by ${book.author}
⭐ ${book.rating}/5.0 (${book.totalRatings} reviews)
🏷️  ${book.requiredTier.toUpperCase()}${book.pageCount ? ` • ${book.pageCount} pages` : ''}

💡 ${book.reason}

👉 Read now: ${baseUrl}/book/${book.id}?utm_source=email&utm_medium=recommendation&utm_campaign=weekly_picks

---
`).join('')}

🚀 EXPLORE YOUR LIBRARY
Visit your complete digital library: ${baseUrl}/bookstore?utm_source=email&utm_medium=recommendation&utm_campaign=weekly_picks

Happy reading from the Wonderful Books team! 📖

---
Wonderful Books - Premium Digital Book Streaming Platform

Manage preferences: ${baseUrl}/account
Unsubscribe: ${unsubscribeUrl}
`;
}

/**
 * Generate email subject line with personalization
 */
export function generateBookRecommendationSubject(data: BookRecommendationEmailData): string {
  const { user, recommendations, totalBooksRead } = data;
  
  const subjects = [
    `📚 ${user.firstName}, your ${recommendations.length} personalized book picks are here!`,
    `🎯 New books chosen just for you, ${user.firstName}!`,
    `📖 Fresh recommendations based on your reading taste, ${user.firstName}`,
    `✨ ${user.firstName}, we found ${recommendations.length} books you'll love!`,
    `📚 Your weekly reading inspiration is ready, ${user.firstName}!`
  ];
  
  if (totalBooksRead > 0) {
    subjects.push(`🎉 ${user.firstName}, celebrate ${totalBooksRead} books with these new picks!`);
  }
  
  // Randomly select a subject for variety
  return subjects[Math.floor(Math.random() * subjects.length)];
}