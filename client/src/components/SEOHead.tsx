import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
  noindex?: boolean;
}

export function SEOHead({
  title = "Wonderful Books - Premium Digital Book Streaming Platform",
  description = "Stream premium books online with secure PDF access. Discover thousands of personal development, business, faith, and mindset books. No downloads required - read instantly on any device.",
  keywords = "online books, PDF streaming, personal development books, business books, spiritual books, mindset books, digital library, book subscription, secure reading, professional development",
  ogTitle,
  ogDescription,
  ogImage = "/og-image.jpg",
  ogUrl,
  twitterTitle,
  twitterDescription,
  twitterImage,
  canonical,
  noindex = false
}: SEOHeadProps) {
  
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper function to update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let tag = document.querySelector(selector) as HTMLMetaElement;
      
      if (!tag) {
        tag = document.createElement('meta');
        if (isProperty) {
          tag.setAttribute('property', property);
        } else {
          tag.setAttribute('name', property);
        }
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    // Helper function to update or create link tags
    const updateLinkTag = (rel: string, href: string) => {
      let tag = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!tag) {
        tag = document.createElement('link');
        tag.rel = rel;
        document.head.appendChild(tag);
      }
      tag.href = href;
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=5.0');
    updateMetaTag('theme-color', '#ea580c'); // easyJet orange
    
    // Robots meta tag
    updateMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph tags
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:site_name', 'Wonderful Books', true);
    updateMetaTag('og:title', ogTitle || title, true);
    updateMetaTag('og:description', ogDescription || description, true);
    updateMetaTag('og:image', window.location.origin + ogImage, true);
    updateMetaTag('og:url', ogUrl || window.location.href, true);
    updateMetaTag('og:locale', 'en_US', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:site', '@WonderfulBooks');
    updateMetaTag('twitter:creator', '@WonderfulBooks');
    updateMetaTag('twitter:title', twitterTitle || ogTitle || title);
    updateMetaTag('twitter:description', twitterDescription || ogDescription || description);
    updateMetaTag('twitter:image', window.location.origin + (twitterImage || ogImage));

    // Additional meta tags for better SEO
    updateMetaTag('author', 'Wonderful Books');
    updateMetaTag('publisher', 'Wonderful Books');
    updateMetaTag('language', 'English');
    updateMetaTag('classification', 'Education, Books, Personal Development');
    updateMetaTag('rating', 'General');
    updateMetaTag('distribution', 'Global');

    // Canonical link
    if (canonical) {
      updateLinkTag('canonical', canonical);
    } else {
      updateLinkTag('canonical', window.location.href);
    }

    // Preconnect to external resources
    const preconnects = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://unpkg.com'
    ];
    
    preconnects.forEach(url => {
      if (!document.querySelector(`link[rel="preconnect"][href="${url}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        if (url.includes('gstatic')) link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });

  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl, twitterTitle, twitterDescription, twitterImage, canonical, noindex]);

  return null; // This component only updates head, doesn't render anything
}

// SEO configurations for different pages
export const seoConfigs = {
  home: {
    title: "Wonderful Books - Premium Digital Book Streaming Platform",
    description: "Stream premium books online with secure PDF access. Discover thousands of personal development, business, faith, and mindset books. No downloads required - read instantly on any device.",
    keywords: "online books, PDF streaming, personal development books, business books, digital library, book subscription, secure reading"
  },
  
  bookstore: {
    title: "Book Store - Browse Premium Books | Wonderful Books",
    description: "Explore our vast collection of premium books across personal development, business success, spirituality, and mindset categories. Stream securely without downloads.",
    keywords: "book store, online bookstore, premium books, personal development, business books, spiritual books, mindset books, digital books"
  },
  
  library: {
    title: "My Library - Your Personal Book Collection | Wonderful Books",
    description: "Access your personal digital library with reading progress, bookmarks, and favorite books. Continue reading where you left off across all your devices.",
    keywords: "digital library, personal books, reading progress, bookmarks, my books, book collection"
  },
  
  dashboard: {
    title: "Dashboard - Reading Analytics & Progress | Wonderful Books",
    description: "Track your reading journey with detailed analytics, progress insights, and personalized recommendations. Optimize your learning with data-driven insights.",
    keywords: "reading analytics, reading progress, book statistics, learning insights, reading dashboard",
    noindex: true
  },
  
  subscribe: {
    title: "Subscription Plans - Unlimited Book Access | Wonderful Books",
    description: "Choose your perfect plan: Free Trial (3 books), Basic (£9.99/month for 10 books), or Premium (£19.99/month unlimited). Cancel anytime.",
    keywords: "book subscription, premium books, subscription plans, unlimited books, book streaming service"
  },

  admin: {
    title: "Admin Panel | Wonderful Books",
    description: "Administrative panel for content management",
    noindex: true
  }
};

// Helper function to get book-specific SEO
export const getBookSEO = (book: any) => ({
  title: `${book.title} by ${book.author} - Read Online | Wonderful Books`,
  description: `Read "${book.title}" by ${book.author} online. ${book.description?.replace(/<[^>]*>/g, '').substring(0, 150)}... Stream securely without downloads.`,
  keywords: `${book.title}, ${book.author}, ${book.category}, online reading, PDF streaming, ${book.title.split(' ').slice(0, 3).join(', ')}`,
  ogTitle: `${book.title} by ${book.author}`,
  ogDescription: `Read "${book.title}" online. ${book.description?.replace(/<[^>]*>/g, '').substring(0, 160)}...`,
  ogImage: book.coverImageUrl || '/og-book-default.jpg'
});