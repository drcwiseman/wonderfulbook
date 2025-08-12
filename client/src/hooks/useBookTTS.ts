import { useState, useCallback, useEffect, useRef } from 'react';

export interface BookTTSSettings {
  enabled: boolean;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  highlightText: boolean;
  autoRead: boolean;
}

export interface BookTTSState {
  isReading: boolean;
  isPaused: boolean;
  currentText: string;
  currentSentenceIndex: number;
  availableVoices: SpeechSynthesisVoice[];
}

const defaultSettings: BookTTSSettings = {
  enabled: false,
  voice: 'default',
  rate: 1.0,
  pitch: 1.0,
  volume: 0.8,
  highlightText: true,
  autoRead: false
};

export function useBookTTS(bookId?: string) {
  const [settings, setSettings] = useState<BookTTSSettings>(defaultSettings);
  const [state, setState] = useState<BookTTSState>({
    isReading: false,
    isPaused: false,
    currentText: '',
    currentSentenceIndex: 0,
    availableVoices: []
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textSegmentsRef = useRef<string[]>([]);

  // Load book-specific TTS settings
  useEffect(() => {
    if (bookId) {
      const savedSettings = localStorage.getItem(`book-tts-${bookId}`);
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (error) {
          console.warn('Failed to load book TTS settings:', error);
        }
      }
    }
  }, [bookId]);

  // Load available voices
  useEffect(() => {
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

  // Save settings when they change
  const updateSettings = useCallback((newSettings: Partial<BookTTSSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (bookId) {
        localStorage.setItem(`book-tts-${bookId}`, JSON.stringify(updated));
      }
      return updated;
    });
  }, [bookId]);

  // Split text into manageable segments for better control
  const splitTextIntoSegments = useCallback((text: string): string[] => {
    return text
      .split(/[.!?]+/)
      .map(segment => segment.trim())
      .filter(segment => segment.length > 0)
      .map(segment => segment + '.');
  }, []);

  // Start reading text
  const startReading = useCallback((text: string) => {
    if (!settings.enabled || !text.trim()) return;

    // Stop any current reading
    speechSynthesis.cancel();

    const segments = splitTextIntoSegments(text);
    textSegmentsRef.current = segments;

    if (segments.length === 0) return;

    setState(prev => ({
      ...prev,
      isReading: true,
      isPaused: false,
      currentText: text,
      currentSentenceIndex: 0
    }));

    // Start reading from the first segment
    readSegment(0, segments);
  }, [settings, splitTextIntoSegments]);

  // Read a specific segment
  const readSegment = useCallback((index: number, segments: string[]) => {
    if (index >= segments.length) {
      // Finished reading all segments
      setState(prev => ({ ...prev, isReading: false, currentSentenceIndex: 0 }));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(segments[index]);
    
    // Configure voice settings
    if (settings.voice !== 'default') {
      const selectedVoice = state.availableVoices.find(v => v.name === settings.voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }
    
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    // Handle events
    utterance.onend = () => {
      if (state.isReading && !state.isPaused) {
        // Continue to next segment
        setState(prev => ({ ...prev, currentSentenceIndex: index + 1 }));
        setTimeout(() => readSegment(index + 1, segments), 100);
      }
    };

    utterance.onerror = (error) => {
      console.error('TTS Error:', error);
      setState(prev => ({ ...prev, isReading: false, isPaused: false }));
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [settings, state.availableVoices, state.isReading, state.isPaused]);

  // Pause reading
  const pauseReading = useCallback(() => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, []);

  // Resume reading
  const resumeReading = useCallback(() => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, []);

  // Stop reading
  const stopReading = useCallback(() => {
    speechSynthesis.cancel();
    setState(prev => ({
      ...prev,
      isReading: false,
      isPaused: false,
      currentSentenceIndex: 0,
      currentText: ''
    }));
    utteranceRef.current = null;
    textSegmentsRef.current = [];
  }, []);

  // Skip to next sentence
  const skipToNext = useCallback(() => {
    if (state.isReading && textSegmentsRef.current.length > 0) {
      speechSynthesis.cancel();
      const nextIndex = state.currentSentenceIndex + 1;
      if (nextIndex < textSegmentsRef.current.length) {
        setState(prev => ({ ...prev, currentSentenceIndex: nextIndex }));
        setTimeout(() => readSegment(nextIndex, textSegmentsRef.current), 100);
      } else {
        stopReading();
      }
    }
  }, [state.isReading, state.currentSentenceIndex, readSegment, stopReading]);

  // Skip to previous sentence
  const skipToPrevious = useCallback(() => {
    if (state.isReading && textSegmentsRef.current.length > 0) {
      speechSynthesis.cancel();
      const prevIndex = Math.max(0, state.currentSentenceIndex - 1);
      setState(prev => ({ ...prev, currentSentenceIndex: prevIndex }));
      setTimeout(() => readSegment(prevIndex, textSegmentsRef.current), 100);
    }
  }, [state.isReading, state.currentSentenceIndex, readSegment]);

  // Get current reading progress
  const getReadingProgress = useCallback(() => {
    if (!state.isReading || textSegmentsRef.current.length === 0) {
      return { current: 0, total: 0, percentage: 0 };
    }

    const current = state.currentSentenceIndex + 1;
    const total = textSegmentsRef.current.length;
    const percentage = (current / total) * 100;

    return { current, total, percentage };
  }, [state.isReading, state.currentSentenceIndex]);

  return {
    settings,
    state,
    updateSettings,
    startReading,
    pauseReading,
    resumeReading,
    stopReading,
    skipToNext,
    skipToPrevious,
    getReadingProgress
  };
}