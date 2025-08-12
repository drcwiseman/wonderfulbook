import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ShareData {
  title: string;
  text: string;
  url: string;
}

interface ShareOptions {
  bookTitle: string;
  bookAuthor?: string;
  bookDescription?: string;
  bookUrl: string;
  platform?: string;
}

export function useSocialShare() {
  const { toast } = useToast();

  const generateShareText = useCallback((options: ShareOptions, platform: string = 'default') => {
    const { bookTitle, bookAuthor = '', bookDescription = '' } = options;
    
    const shareTexts = {
      default: `Reading "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} on Wonderful Books`,
      twitter: `Currently reading "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} 📚✨ #BookLovers #DigitalReading`,
      facebook: `I'm reading "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} on Wonderful Books. This digital book streaming platform is fantastic for book lovers!`,
      linkedin: `Reading "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} - highly recommend this digital book platform for professionals and book enthusiasts.`,
      whatsapp: `📖 Reading "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} on Wonderful Books! Great book, you should check it out!`,
      email: `Book Recommendation: ${bookTitle}${bookAuthor ? ` by ${bookAuthor}` : ''}`
    };

    return shareTexts[platform as keyof typeof shareTexts] || shareTexts.default;
  }, []);

  const shareToSocial = useCallback(async (options: ShareOptions, platform: string) => {
    const { bookTitle, bookAuthor, bookDescription, bookUrl } = options;
    
    const shareText = generateShareText(options, platform);
    const encodedUrl = encodeURIComponent(bookUrl);
    const encodedText = encodeURIComponent(shareText);
    
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=BookLovers,DigitalReading,WonderfulBooks`;
        break;
        
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
        
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodeURIComponent(bookTitle)}&summary=${encodedText}`;
        break;
        
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + bookUrl)}`;
        break;
        
      case 'email':
        const emailSubject = `Book Recommendation: ${bookTitle}${bookAuthor ? ` by ${bookAuthor}` : ''}`;
        const emailBody = `Hi,\n\nI wanted to share this amazing book I'm reading: "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''}.\n\n${bookDescription || `Discover this book and thousands more on Wonderful Books - the premium digital book streaming platform.`}\n\nCheck it out here: ${bookUrl}\n\nHappy reading!\nBest regards`;
        shareUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        break;
        
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
        
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(shareText)}`;
        break;
        
      default:
        console.error('Unsupported platform:', platform);
        return false;
    }

    if (shareUrl) {
      const popup = window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500,scrollbars=yes,resizable=yes');
      
      if (popup) {
        // Track successful share attempt
        console.log(`Book shared on ${platform}:`, bookTitle);
        
        toast({
          title: "Share opened",
          description: `Opening ${platform} share dialog for "${bookTitle}"`,
        });
        
        return true;
      } else {
        toast({
          title: "Pop-up blocked",
          description: "Please allow pop-ups to share on social media",
          variant: "destructive",
        });
        return false;
      }
    }
    
    return false;
  }, [generateShareText, toast]);

  const shareNative = useCallback(async (options: ShareOptions) => {
    if (!navigator.share) {
      return false;
    }

    const { bookTitle, bookUrl } = options;
    const shareText = generateShareText(options);

    try {
      const shareData: ShareData = {
        title: bookTitle,
        text: shareText,
        url: bookUrl
      };

      await navigator.share(shareData);
      
      console.log('Book shared successfully via native share:', bookTitle);
      
      toast({
        title: "Book shared!",
        description: `"${bookTitle}" has been shared successfully`,
      });
      
      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled the share, don't show an error
        return false;
      }
      
      console.error('Native share failed:', error);
      
      toast({
        title: "Share failed",
        description: "Unable to share using device's native sharing. Try individual platform buttons.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [generateShareText, toast]);

  const copyToClipboard = useCallback(async (bookUrl: string, bookTitle: string) => {
    try {
      await navigator.clipboard.writeText(bookUrl);
      
      toast({
        title: "Link copied!",
        description: `Book link for "${bookTitle}" copied to clipboard`,
      });
      
      return true;
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      
      toast({
        title: "Copy failed",
        description: "Please manually copy the book URL from your browser address bar",
        variant: "destructive",
      });
      
      return false;
    }
  }, [toast]);

  const generateMetaTags = useCallback((options: ShareOptions) => {
    const { bookTitle, bookAuthor, bookDescription, bookUrl } = options;
    
    const shareDescription = bookDescription || `Discover "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} and thousands of other books on Wonderful Books.`;
    
    return {
      // Open Graph tags for Facebook, LinkedIn, etc.
      'og:type': 'book',
      'og:title': bookTitle,
      'og:description': shareDescription,
      'og:url': bookUrl,
      'og:site_name': 'Wonderful Books',
      'og:locale': 'en_US',
      
      // Twitter Card tags
      'twitter:card': 'summary_large_image',
      'twitter:site': '@WonderfulBooks',
      'twitter:title': bookTitle,
      'twitter:description': shareDescription,
      'twitter:url': bookUrl,
      
      // Book-specific tags
      'book:author': bookAuthor || '',
      'book:isbn': '', // Could be added if available
      'book:tag': 'digital book, ebook, reading, literature',
      
      // General meta tags
      'description': shareDescription,
      'title': `${bookTitle} - Wonderful Books`
    };
  }, []);

  return {
    shareToSocial,
    shareNative,
    copyToClipboard,
    generateShareText,
    generateMetaTags
  };
}