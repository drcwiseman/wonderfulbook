import React, { createContext, useContext, ReactNode } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';

interface AccessibilityContextType {
  settings: any;
  isReading: boolean;
  isPaused: boolean;
  availableVoices: SpeechSynthesisVoice[];
  updateSettings: (settings: any) => void;
  startTextToSpeech: (text?: string) => void;
  pauseTextToSpeech: () => void;
  resumeTextToSpeech: () => void;
  stopTextToSpeech: () => void;
  resetSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const accessibilityHook = useAccessibility();

  return (
    <AccessibilityContext.Provider value={accessibilityHook}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider');
  }
  return context;
}