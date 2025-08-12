import React from 'react';
import { Helmet } from 'react-helmet-async';

interface Book {
  id: string;
  title: string;
  author: string;
  description?: string | null;
  isbn?: string | null;
  coverImageUrl?: string | null;
  rating?: string | null;
  totalPages?: number | null;
  publishedDate?: string | null;
  category?: string | null;
  requiredTier?: string | null;
  language?: string | null;
  publisher?: string | null;
  pageCount?: number | null;
}

interface BookStructuredDataProps {
  book: Book;
  url?: string;
}

export default function BookStructuredData({ book, url }: BookStructuredDataProps) {
  const currentUrl = url || `https://mywonderfulbooks.com/book/${book.id}`;
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": book.title,
    "author": {
      "@type": "Person",
      "name": book.author
    },
    "description": book.description ? String(book.description) : `${book.title} by ${book.author} - Available for streaming on Wonderful Books, your digital book platform.`,
    "url": currentUrl,
    "image": book.coverImageUrl ? String(book.coverImageUrl) : "https://mywonderfulbooks.com/book-cover-placeholder.svg",
    "publisher": {
      "@type": "Organization", 
      "name": book.publisher || "Wonderful Books",
      "url": "https://mywonderfulbooks.com"
    },
    "datePublished": book.publishedDate,
    "inLanguage": book.language || "en-US",
    "numberOfPages": book.totalPages || book.pageCount,
    "genre": book.category || "Personal Development",
    "aggregateRating": book.rating ? {
      "@type": "AggregateRating",
      "ratingValue": book.rating,
      "bestRating": "5",
      "worstRating": "1"
    } : undefined,
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "price": book.requiredTier === 'free' ? "0" : book.requiredTier === 'basic' ? "5.99" : "9.99",
      "priceCurrency": "GBP",
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      "seller": {
        "@type": "Organization",
        "name": "Wonderful Books",
        "url": "https://mywonderfulbooks.com"
      },
      "itemCondition": "https://schema.org/NewCondition",
      "category": "Digital Book Streaming"
    },
    "potentialAction": {
      "@type": "ReadAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": currentUrl,
        "actionPlatform": [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform"
        ]
      },
      "expectsAcceptanceOf": {
        "@type": "Offer",
        "category": book.requiredTier === 'free' ? "Free Trial" : book.requiredTier === 'basic' ? "Basic Subscription" : "Premium Subscription"
      }
    },
    "isPartOf": {
      "@type": "Collection",
      "name": "Wonderful Books Digital Library",
      "description": "Premium digital book streaming platform with professional and personal development titles",
      "url": "https://mywonderfulbooks.com"
    }
  };

  // Remove undefined fields
  const cleanStructuredData = JSON.parse(JSON.stringify(structuredData));

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(cleanStructuredData, null, 2)}
      </script>
    </Helmet>
  );
}

// Collection-level structured data for book listings
interface BookCollectionStructuredDataProps {
  books: Book[];
  collectionName?: string;
  collectionUrl?: string;
}

export function BookCollectionStructuredData({ 
  books, 
  collectionName = "Wonderful Books Library",
  collectionUrl = "https://mywonderfulbooks.com/bookstore" 
}: BookCollectionStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Collection",
    "name": collectionName,
    "description": "Professional and personal development books available for streaming",
    "url": collectionUrl,
    "publisher": {
      "@type": "Organization",
      "name": "Wonderful Books",
      "url": "https://mywonderfulbooks.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mywonderfulbooks.com/favicon.svg"
      }
    },
    "hasPart": books.slice(0, 10).map(book => ({ // Limit to 10 books to avoid massive JSON
      "@type": "Book",
      "name": book.title,
      "author": {
        "@type": "Person",
        "name": book.author
      },
      "url": `https://mywonderfulbooks.com/book/${book.id}`,
      "image": book.coverImageUrl ? String(book.coverImageUrl) : undefined,
      "description": book.description,
      "genre": book.category || "Personal Development"
    })),
    "numberOfItems": books.length,
    "offers": {
      "@type": "AggregateOffer",
      "availability": "https://schema.org/InStock",
      "lowPrice": "0",
      "highPrice": "9.99",
      "priceCurrency": "GBP",
      "offerCount": books.length,
      "seller": {
        "@type": "Organization",
        "name": "Wonderful Books"
      }
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData, null, 2)}
      </script>
    </Helmet>
  );
}

// Organization structured data for the main site
export function OrganizationStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Wonderful Books",
    "alternateName": "My Wonderful Books",
    "url": "https://mywonderfulbooks.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://mywonderfulbooks.com/favicon.svg",
      "width": "60",
      "height": "60"
    },
    "description": "Premium digital book streaming platform offering professional and personal development titles with subscription-based access",
    "foundingDate": "2025",
    "founder": {
      "@type": "Person",
      "name": "Wonderful Books Team"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+44-800-123-4567",
      "contactType": "Customer Service",
      "email": "admin@thekingdommail.info",
      "availableLanguage": ["English"]
    },
    "sameAs": [
      "https://mywonderfulbooks.com"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Digital Book Subscriptions",
      "itemListElement": [
        {
          "@type": "Offer",
          "name": "Free Trial",
          "description": "7-day free access to our book library",
          "price": "0",
          "priceCurrency": "GBP",
          "eligibleDuration": "P7D"
        },
        {
          "@type": "Offer", 
          "name": "Basic Subscription",
          "description": "Access to 10 books per month",
          "price": "5.99",
          "priceCurrency": "GBP",
          "eligibleDuration": "P1M"
        },
        {
          "@type": "Offer",
          "name": "Premium Subscription", 
          "description": "Unlimited access to entire book library",
          "price": "9.99",
          "priceCurrency": "GBP",
          "eligibleDuration": "P1M"
        }
      ]
    },
    "serviceType": "Digital Book Streaming",
    "areaServed": "Worldwide",
    "knowsAbout": [
      "Personal Development",
      "Professional Development", 
      "Business Books",
      "Self-Help",
      "Digital Publishing",
      "Book Streaming"
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData, null, 2)}
      </script>
    </Helmet>
  );
}