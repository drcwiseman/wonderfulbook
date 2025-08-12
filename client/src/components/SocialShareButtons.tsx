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

  // Create share text variants
  const shareTexts = {
    default: `Reading "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} on Wonderful Books`,
    twitter: `Currently reading "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} 📚✨`,
    facebook: `I'm reading "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} on Wonderful Books. Great digital book streaming platform!`,
    linkedin: `Reading "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} - highly recommend this digital book platform for book lovers.`,
    email: `Book Recommendation: ${bookTitle}${bookAuthor ? ` by ${bookAuthor}` : ''}`,
    whatsapp: `📖 Reading "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} on Wonderful Books! Check it out:`
  };

  const shareDescription = bookDescription || `Discover "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''} and thousands of other books on Wonderful Books - the premium digital book streaming platform.`;

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
    
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(shareTexts.facebook)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodeURIComponent(bookTitle)}&summary=${encodeURIComponent(shareTexts.linkedin)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareTexts.whatsapp + ' ' + bookUrl)}`;
        break;
      case 'email':
        const emailBody = `Hi,\n\nI wanted to share this great book I'm reading: "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''}.\n\n${shareDescription}\n\nCheck it out here: ${bookUrl}\n\nBest regards`;
        shareUrl = `mailto:?subject=${encodeURIComponent(shareTexts.email)}&body=${encodeURIComponent(emailBody)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    }

    // Track sharing event
    console.log(`Book shared on ${platform}:`, bookTitle);
  };

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