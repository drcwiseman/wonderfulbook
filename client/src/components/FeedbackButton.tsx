import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bug } from 'lucide-react';
import FeedbackWidget from './FeedbackWidget';

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Feedback Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-16 z-40 bg-orange-500 hover:bg-orange-600 text-white shadow-lg rounded-full p-3 h-12 w-12 transition-all duration-200 hover:scale-110"
        aria-label="Send Feedback"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Feedback Widget Modal */}
      {isOpen && <FeedbackWidget onClose={() => setIsOpen(false)} />}
    </>
  );
}