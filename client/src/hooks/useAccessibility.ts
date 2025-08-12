import { useState, useEffect, useCallback } from 'react';

interface AccessibilitySettings {
  textToSpeech: boolean;
  dyslexiaFont: boolean;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  highContrast: boolean;
  darkMode: boolean;
  readingSpeed: number;
  voiceType: string;
  highlightText: boolean;
}

interface AccessibilityState {
  settings: AccessibilitySettings;
  isReading: boolean;
  isPaused: boolean;
  currentUtterance: SpeechSynthesisUtterance | null;
  availableVoices: SpeechSynthesisVoice[];
}

const defaultSettings: AccessibilitySettings = {
  textToSpeech: false,
  dyslexiaFont: false,
  fontSize: 16,
  lineHeight: 1.5,
  letterSpacing: 0,
  highContrast: false,
  darkMode: false,
  readingSpeed: 1,
  voiceType: 'default',
  highlightText: true
};

export function useAccessibility() {
  const [state, setState] = useState<AccessibilityState>({
    settings: defaultSettings,
    isReading: false,
    isPaused: false,
    currentUtterance: null,
    availableVoices: []
  });

  // Clear any problematic saved settings and start fresh
  useEffect(() => {
    // Clear saved settings to stop flickering
    localStorage.removeItem('accessibility-settings');
    
    // Reset to clean defaults
    setState(prev => ({ ...prev, settings: defaultSettings }));
    
    // Clear any applied CSS classes
    const body = document.body;
    const root = document.documentElement;
    
    // Remove all accessibility classes
    body.classList.remove(
      'dyslexic-font', 
      'accessibility-font-size', 
      'accessibility-line-height', 
      'accessibility-letter-spacing',
      'high-contrast',
      'highlight-reading-text'
    );
    
    // Remove CSS variables
    root.style.removeProperty('--font-family');
    root.style.removeProperty('--accessibility-font-size');
    root.style.removeProperty('--accessibility-line-height');
    root.style.removeProperty('--accessibility-letter-spacing');

    // Load available voices
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setState(prev => ({ ...prev, availableVoices: voices }));
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      speechSynthesis.cancel();
    };
  }, []);

  // Apply accessibility settings to the document only when features are enabled
  const applyAccessibilitySettings = useCallback((settings: AccessibilitySettings) => {
    const root = document.documentElement;
    const body = document.body;
    
    // Font settings - only apply when dyslexia font is enabled
    if (settings.dyslexiaFont) {
      root.style.setProperty('--font-family', '"OpenDyslexic", "Comic Sans MS", Arial, sans-serif');
      body.classList.add('dyslexic-font');
    } else {
      root.style.removeProperty('--font-family');
      body.classList.remove('dyslexic-font');
    }

    // Typography settings - only store as CSS variables but don't apply to body
    root.style.setProperty('--accessibility-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--accessibility-line-height', settings.lineHeight.toString());
    root.style.setProperty('--accessibility-letter-spacing', `${settings.letterSpacing}px`);
    
    // Only apply typography classes when they differ from defaults significantly
    const defaultFontSize = 16;
    const defaultLineHeight = 1.6;
    const defaultLetterSpacing = 0;
    
    // Font size class - only add if changed significantly
    if (Math.abs(settings.fontSize - defaultFontSize) > 1) {
      body.classList.add('accessibility-font-size');
    } else {
      body.classList.remove('accessibility-font-size');
    }
    
    // Line height class - only add if changed significantly  
    if (Math.abs(settings.lineHeight - defaultLineHeight) > 0.2) {
      body.classList.add('accessibility-line-height');
    } else {
      body.classList.remove('accessibility-line-height');
    }
    
    // Letter spacing class - only add if changed
    if (settings.letterSpacing !== defaultLetterSpacing) {
      body.classList.add('accessibility-letter-spacing');
    } else {
      body.classList.remove('accessibility-letter-spacing');
    }

    // High contrast mode
    if (settings.highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    // Dark mode
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Text highlighting
    if (settings.highlightText) {
      body.classList.add('highlight-reading-text');
    } else {
      body.classList.remove('highlight-reading-text');
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    setState(prev => {
      const updated = { ...prev.settings, ...newSettings };
      localStorage.setItem('accessibility-settings', JSON.stringify(updated));
      applyAccessibilitySettings(updated);
      return { ...prev, settings: updated };
    });
  }, [applyAccessibilitySettings]);

  const getTextContent = useCallback((element: Element): string => {
    let text = '';
    
    // Convert NodeList to Array for iteration
    const childNodes = Array.from(element.childNodes);
    
    for (const node of childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += (node.textContent || '').trim() + ' ';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        
        // Skip script, style, and hidden elements
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG'].includes(el.tagName) || 
            el.getAttribute('aria-hidden') === 'true' ||
            el.hasAttribute('data-skip-tts') ||
            getComputedStyle(el).display === 'none' ||
            getComputedStyle(el).visibility === 'hidden') {
          continue;
        }
        
        // Add paragraph breaks
        if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'].includes(el.tagName)) {
          text += getTextContent(el) + '. ';
        } else {
          text += getTextContent(el);
        }
      }
    }
    
    return text.replace(/\s+/g, ' ').trim();
  }, []);

  const startTextToSpeech = useCallback((customText?: string) => {
    if (!state.settings.textToSpeech) return;

    // Stop any current speech
    speechSynthesis.cancel();

    let text = customText;
    
    if (!text) {
      // Get main content text
      const mainContent = document.querySelector('main') || 
                         document.querySelector('[role="main"]') || 
                         document.querySelector('.pdf-viewer') ||
                         document.querySelector('.book-content') ||
                         document.body;

      if (!mainContent) return;
      text = getTextContent(mainContent);
    }

    if (!text || text.length < 3) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure speech settings
    utterance.rate = state.settings.readingSpeed;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Set voice if available
    if (state.settings.voiceType !== 'default' && state.availableVoices.length > 0) {
      const selectedVoice = state.availableVoices.find(voice => 
        voice.name === state.settings.voiceType || voice.lang === state.settings.voiceType
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    // Event handlers
    utterance.onstart = () => {
      setState(prev => ({ ...prev, isReading: true, isPaused: false }));
    };

    utterance.onend = () => {
      setState(prev => ({ ...prev, isReading: false, isPaused: false, currentUtterance: null }));
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      setState(prev => ({ ...prev, isReading: false, isPaused: false, currentUtterance: null }));
    };

    setState(prev => ({ ...prev, currentUtterance: utterance }));
    speechSynthesis.speak(utterance);
  }, [state.settings.textToSpeech, state.settings.readingSpeed, state.settings.voiceType, state.availableVoices, getTextContent]);

  const pauseTextToSpeech = useCallback(() => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, []);

  const resumeTextToSpeech = useCallback(() => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, []);

  const stopTextToSpeech = useCallback(() => {
    speechSynthesis.cancel();
    setState(prev => ({ ...prev, isReading: false, isPaused: false, currentUtterance: null }));
  }, []);

  const resetSettings = useCallback(() => {
    setState(prev => ({ ...prev, settings: defaultSettings }));
    localStorage.setItem('accessibility-settings', JSON.stringify(defaultSettings));
    applyAccessibilitySettings(defaultSettings);
  }, [applyAccessibilitySettings]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only activate if accessibility features are enabled
      if (!state.settings.textToSpeech) return;

      // Alt + S to start/stop reading
      if (event.altKey && event.key === 's') {
        event.preventDefault();
        if (state.isReading) {
          stopTextToSpeech();
        } else {
          startTextToSpeech();
        }
      }

      // Alt + P to pause/resume reading
      if (event.altKey && event.key === 'p') {
        event.preventDefault();
        if (state.isReading) {
          if (state.isPaused) {
            resumeTextToSpeech();
          } else {
            pauseTextToSpeech();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.settings.textToSpeech, state.isReading, state.isPaused, startTextToSpeech, pauseTextToSpeech, resumeTextToSpeech, stopTextToSpeech]);

  return {
    settings: state.settings,
    isReading: state.isReading,
    isPaused: state.isPaused,
    availableVoices: state.availableVoices,
    updateSettings,
    startTextToSpeech,
    pauseTextToSpeech,
    resumeTextToSpeech,
    stopTextToSpeech,
    resetSettings
  };
}