import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Mail, 
  Link, 
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialShareButtonsProps {
  bookTitle: string;
  bookAuthor?: string;
  bookDescription?: string;
  bookUrl: string;
  bookCover?: string;
  className?: string;
  compact?: boolean;
}

export default function SocialShareButtons({
  bookTitle,
  bookAuthor = '',
  bookDescription = '',
  bookUrl,
  bookCover = '',
  className = '',
  compact = false
}: SocialShareButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Create compelling advertising share text variants
  const shareTexts = {
    default: `📚 Just discovered "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} on Wonderful Books! Amazing digital book streaming platform.`,
    twitter: `🔥 Reading "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} and loving it! 📖✨ Unlimited books, no downloads needed. Try the 7-day free trial! #BookLovers #DigitalReading #WonderfulBooks`,
    facebook: `📖 I'm absolutely loving "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} on Wonderful Books! 

🎯 This digital book streaming platform is a game-changer - thousands of books, instant access, no downloads! Perfect for busy book lovers.

💎 Premium reading experience with features like Text-to-Speech, bookmarks, and seamless syncing across all devices.

🆓 They have a 7-day free trial - definitely worth checking out if you love books!`,
    linkedin: `📚 Professional development insight: Currently reading "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} on Wonderful Books - a revolutionary digital book streaming platform.

✅ Key benefits I've experienced:
• Instant access to thousands of books
• No storage space needed (streaming technology)  
• Advanced reading features (TTS, bookmarks, sync)
• Perfect for busy professionals

🎯 For fellow book enthusiasts and professionals looking to maximize reading time, I highly recommend exploring their platform. They offer a 7-day free trial.`,
    email: `📖 Book Recommendation: ${bookTitle}${bookAuthor ? ` by ${bookAuthor}` : ''}`,
    whatsapp: `📚 Hey! Just found this amazing book: "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} 

I'm reading it on Wonderful Books - it's like Netflix for books! 🎬➡️📖

✨ No downloads, instant streaming, thousands of books available
🆓 7-day free trial if you want to check it out!

Definitely worth it for book lovers 👌`
  };

  // Enhanced description with advertising appeal
  const shareDescription = bookDescription || `Transform your reading experience with "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''}! Stream instantly on Wonderful Books - the premium digital library with thousands of books, advanced reading features, and seamless device syncing. Start your 7-day free trial today!`;

  // Create Open Graph meta tags for image sharing
  const createMetaTags = () => {
    return {
      'og:title': bookTitle,
      'og:description': shareDescription,
      'og:image': bookCover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630",
      'og:url': bookUrl,
      'og:type': 'book',
      'og:site_name': 'Wonderful Books',
      'twitter:card': 'summary_large_image',
      'twitter:title': bookTitle,
      'twitter:description': shareDescription,
      'twitter:image': bookCover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630"
    };
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Book link has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(bookUrl);
    const encodedTitle = encodeURIComponent(shareTexts[platform as keyof typeof shareTexts]);
    const encodedDescription = encodeURIComponent(shareDescription);
    const encodedImage = encodeURIComponent(bookCover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630");
    
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        // Twitter with hashtags and image
        const twitterHashtags = 'BookLovers,DigitalReading,WonderfulBooks,FreeTrial,BookStreaming';
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=${twitterHashtags}`;
        break;
      case 'facebook':
        // Facebook with enhanced sharing - image will be auto-detected from og:image meta tag
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(shareTexts.facebook)}`;
        break;
      case 'linkedin':
        // LinkedIn professional sharing with image
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodeURIComponent(bookTitle)}&summary=${encodeURIComponent(shareTexts.linkedin)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareTexts.whatsapp + '\n\n' + bookUrl)}`;
        break;
      case 'email':
        const emailBody = `Hi there! 👋

I wanted to share this incredible book I'm reading: "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''}

${shareDescription}

🔥 What makes this platform amazing:
• Stream thousands of books instantly (no downloads!)
• Advanced reading features like Text-to-Speech
• Works perfectly on phone, tablet, and computer
• 7-day free trial to explore everything

Check it out here: ${bookUrl}

Trust me, if you love books, you'll love this platform!

Happy reading! 📚✨`;
        shareUrl = `mailto:?subject=${encodeURIComponent(shareTexts.email)}&body=${encodeURIComponent(emailBody)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    }

    // Show success message with advertising impact
    toast({
      title: "📢 Share opened!",
      description: `Help others discover "${bookTitle}" and grow our reading community!`,
    });

    // Track sharing event
    console.log(`Book shared on ${platform}:`, { title: bookTitle, image: bookCover, url: bookUrl });
  };

  // Update document meta tags for better social sharing
  const updateMetaTags = () => {
    const metaTags = createMetaTags();
    
    // Update existing meta tags or create new ones
    Object.entries(metaTags).forEach(([property, content]) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`) || 
                    document.querySelector(`meta[name="${property}"]`);
      
      if (metaTag) {
        metaTag.setAttribute('content', content);
      } else {
        metaTag = document.createElement('meta');
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
          metaTag.setAttribute('property', property);
        } else {
          metaTag.setAttribute('name', property);
        }
        metaTag.setAttribute('content', content);
        document.head.appendChild(metaTag);
      }
    });
  };

  // Update meta tags when component mounts or book data changes
  React.useEffect(() => {
    updateMetaTags();
  }, [bookTitle, bookCover, bookUrl]);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: bookTitle,
          text: shareTexts.default,
          url: bookUrl
        });
        console.log('Book shared successfully via native share');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Native share failed:', error);
          setIsOpen(true); // Fallback to custom share menu
        }
      }
    } else {
      setIsOpen(true); // Show custom share menu if native share not available
    }
  };

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="flex items-center gap-2 border-orange-200 text-orange-600 hover:bg-orange-50"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <Card className="absolute top-full mt-2 right-0 z-50 w-64 shadow-lg">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Share Book</span>
                    <Badge variant="secondary" className="text-xs">
                      {bookTitle.length > 15 ? bookTitle.substring(0, 15) + '...' : bookTitle}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('twitter')}
                      className="flex items-center gap-2 justify-start"
                    >
                      <Twitter className="w-4 h-4 text-blue-400" />
                      Twitter
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('facebook')}
                      className="flex items-center gap-2 justify-start"
                    >
                      <Facebook className="w-4 h-4 text-blue-600" />
                      Facebook
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('linkedin')}
                      className="flex items-center gap-2 justify-start"
                    >
                      <Linkedin className="w-4 h-4 text-blue-700" />
                      LinkedIn
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('whatsapp')}
                      className="flex items-center gap-2 justify-start"
                    >
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      WhatsApp
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('email')}
                      className="flex items-center gap-2 justify-start"
                    >
                      <Mail className="w-4 h-4 text-gray-600" />
                      Email
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLink}
                      className="flex items-center gap-2 justify-start"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Link className="w-4 h-4 text-gray-600" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  // Full-size share buttons
  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Share This Book</h3>
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              {bookTitle}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => handleShare('twitter')}
              className="flex items-center gap-3 justify-start p-3 h-auto border-blue-200 hover:bg-blue-50"
            >
              <Twitter className="w-5 h-5 text-blue-400" />
              <div className="text-left">
                <div className="text-sm font-medium">Twitter</div>
                <div className="text-xs text-gray-500">Share with followers</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleShare('facebook')}
              className="flex items-center gap-3 justify-start p-3 h-auto border-blue-200 hover:bg-blue-50"
            >
              <Facebook className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <div className="text-sm font-medium">Facebook</div>
                <div className="text-xs text-gray-500">Share on timeline</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleShare('linkedin')}
              className="flex items-center gap-3 justify-start p-3 h-auto border-blue-200 hover:bg-blue-50"
            >
              <Linkedin className="w-5 h-5 text-blue-700" />
              <div className="text-left">
                <div className="text-sm font-medium">LinkedIn</div>
                <div className="text-xs text-gray-500">Professional network</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleShare('whatsapp')}
              className="flex items-center gap-3 justify-start p-3 h-auto border-green-200 hover:bg-green-50"
            >
              <MessageCircle className="w-5 h-5 text-green-600" />
              <div className="text-left">
                <div className="text-sm font-medium">WhatsApp</div>
                <div className="text-xs text-gray-500">Send to contacts</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleShare('email')}
              className="flex items-center gap-3 justify-start p-3 h-auto border-gray-200 hover:bg-gray-50"
            >
              <Mail className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <div className="text-sm font-medium">Email</div>
                <div className="text-xs text-gray-500">Send recommendation</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="flex items-center gap-3 justify-start p-3 h-auto border-gray-200 hover:bg-gray-50"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <div className="text-sm font-medium text-green-600">Copied!</div>
                    <div className="text-xs text-green-500">Link in clipboard</div>
                  </div>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 text-gray-600" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Copy Link</div>
                    <div className="text-xs text-gray-500">Share anywhere</div>
                  </div>
                </>
              )}
            </Button>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Share "{bookTitle}" with friends and help them discover great books on Wonderful Books
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}