import type { Express } from "express";
import path from "path";
import { storage } from "./storage";

// SEO and sitemap routes
export function registerSEORoutes(app: Express) {
  
  // Serve sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    res.set('Content-Type', 'application/xml');
    res.sendFile(path.join(process.cwd(), 'public', 'sitemap.xml'));
  });
  
  // Serve robots.txt
  app.get('/robots.txt', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.sendFile(path.join(process.cwd(), 'public', 'robots.txt'));
  });
  
  // Dynamic sitemap generation endpoint (optional)
  app.get('/api/sitemap', async (req, res) => {
    try {
      const books = await storage.getAllBooks();
      const baseUrl = 'https://wonderful-books.replit.app';
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/bookstore</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/subscribe</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;

      // Add individual book pages
      books.forEach(book => {
        sitemap += `
  <url>
    <loc>${baseUrl}/book/${book.id}</loc>
    <lastmod>${book.updatedAt ? new Date(book.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      sitemap += `
</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });
  
  // JSON-LD structured data endpoint for books
  app.get('/api/book/:id/structured-data', async (req, res) => {
    try {
      const book = await storage.getBook(req.params.id);
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }
      
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": book.title,
        "author": {
          "@type": "Person",
          "name": book.author
        },
        "description": book.description?.replace(/<[^>]*>/g, '').substring(0, 200) + "...",
        "image": book.coverImageUrl ? `https://wonderful-books.replit.app${book.coverImageUrl}` : undefined,
        "url": `https://wonderful-books.replit.app/book/${book.id}`,
        "aggregateRating": book.rating ? {
          "@type": "AggregateRating",
          "ratingValue": book.rating,
          "ratingCount": book.totalRatings || 1
        } : undefined,
        "offers": {
          "@type": "Offer",
          "price": book.requiredTier === 'premium' ? "19.99" : book.requiredTier === 'basic' ? "9.99" : "0",
          "priceCurrency": "GBP",
          "availability": "https://schema.org/InStock",
          "url": `https://wonderful-books.replit.app/book/${book.id}`
        },
        "inLanguage": "en-US",
        "genre": "Self-help, Business, Personal Development",
        "publishingPrinciples": "https://wonderful-books.replit.app/publishing-principles",
        "educationalAlignment": {
          "@type": "AlignmentObject",
          "alignmentType": "teaches",
          "educationalFramework": "Personal Development"
        }
      };
      
      res.json(structuredData);
    } catch (error) {
      console.error('Error generating structured data:', error);
      res.status(500).json({ error: 'Error generating structured data' });
    }
  });
}