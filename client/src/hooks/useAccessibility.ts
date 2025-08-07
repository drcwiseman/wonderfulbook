import { useState, useEffect, useCallback } from "react";

interface AccessibilitySettings {
  textToSpeech: boolean;
  dyslexiaFont: boolean;
  highContrast: boolean;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  voiceRate: number;
  voicePitch: number;
  autoRead: boolean;
  focusMode: boolean;
  colorTheme: 'default' | 'sepia' | 'dark' | 'blue';
}

const defaultSettings: AccessibilitySettings = {
  textToSpeech: false,
  dyslexiaFont: false,
  highContrast: false,
  fontSize: 16,
  lineHeight: 1.6,
  letterSpacing: 0,
  voiceRate: 1,
  voicePitch: 1,
  autoRead: false,
  focusMode: false,
  colorTheme: 'default'
};

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isReading, setIsReading] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('Failed to parse accessibility settings:', error);
      }
    }
  }, []);

  // Apply settings when they change
  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  const applySettings = useCallback((newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // Apply font settings
    if (newSettings.dyslexiaFont) {
      root.style.setProperty('--font-family', '"OpenDyslexic", "Comic Sans MS", cursive');
    } else {
      root.style.removeProperty('--font-family');
    }
    
    root.style.setProperty('--accessibility-font-size', `${newSettings.fontSize}px`);
    root.style.setProperty('--accessibility-line-height', newSettings.lineHeight.toString());
    root.style.setProperty('--accessibility-letter-spacing', `${newSettings.letterSpacing}px`);
    
    // Apply visual modes
    document.body.classList.toggle('high-contrast', newSettings.highContrast);
    document.body.classList.toggle('focus-mode', newSettings.focusMode);
    
    // Apply color theme
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    if (newSettings.colorTheme !== 'default') {
      document.body.classList.add(`theme-${newSettings.colorTheme}`);
    }
  }, []);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('accessibilitySettings', JSON.stringify(newSettings));
  }, [settings]);

  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !settings.textToSpeech) return;

    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.voiceRate;
    utterance.pitch = settings.voicePitch;
    
    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    speechSynthesis.speak(utterance);
  }, [settings.textToSpeech, settings.voiceRate, settings.voicePitch]);

  const stopReading = useCallback(() => {
    speechSynthesis.cancel();
    setIsReading(false);
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.setItem('accessibilitySettings', JSON.stringify(defaultSettings));
  }, []);

  return {
    settings,
    updateSetting,
    speakText,
    stopReading,
    resetSettings,
    isReading
  };
}