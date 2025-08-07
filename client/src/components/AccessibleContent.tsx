import { ReactNode, useEffect, useRef } from "react";
import { useAccessibility } from "@/hooks/useAccessibility";

interface AccessibleContentProps {
  children: ReactNode;
  autoRead?: boolean;
  readOnFocus?: boolean;
  className?: string;
  id?: string;
}

export default function AccessibleContent({ 
  children, 
  autoRead = false, 
  readOnFocus = false,
  className = "",
  id
}: AccessibleContentProps) {
  const { settings, speakText } = useAccessibility();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoRead && settings.autoRead && settings.textToSpeech) {
      const text = contentRef.current?.textContent || '';
      if (text.trim()) {
        speakText(text);
      }
    }
  }, [autoRead, settings.autoRead, settings.textToSpeech, speakText]);

  const handleFocus = () => {
    if (readOnFocus && settings.textToSpeech) {
      const text = contentRef.current?.textContent || '';
      if (text.trim()) {
        speakText(text);
      }
    }
  };

  return (
    <div
      ref={contentRef}
      className={`${className} ${settings.dyslexiaFont ? 'dyslexia-friendly' : ''}`}
      onFocus={handleFocus}
      tabIndex={readOnFocus ? 0 : undefined}
      role={readOnFocus ? 'region' : undefined}
      aria-label={readOnFocus ? 'Readable content' : undefined}
      id={id}
    >
      {children}
    </div>
  );
}

// Component for making text elements speak on click/focus
export function SpeakableText({ 
  children, 
  text,
  className = ""
}: { 
  children: ReactNode;
  text?: string;
  className?: string;
}) {
  const { speakText, settings } = useAccessibility();

  const handleClick = (e: React.MouseEvent) => {
    if (settings.textToSpeech) {
      e.preventDefault();
      const textToSpeak = text || (e.currentTarget as HTMLElement).textContent || '';
      speakText(textToSpeak);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && settings.textToSpeech) {
      e.preventDefault();
      const textToSpeak = text || (e.currentTarget as HTMLElement).textContent || '';
      speakText(textToSpeak);
    }
  };

  return (
    <span
      className={`${className} ${settings.textToSpeech ? 'cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded px-1 transition-colors' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={settings.textToSpeech ? 0 : undefined}
      role={settings.textToSpeech ? 'button' : undefined}
      aria-label={settings.textToSpeech ? 'Click to read aloud' : undefined}
    >
      {children}
    </span>
  );
}