import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Accessibility, 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  SkipBack, 
  SkipForward,
  Settings,
  Eye,
  Type,
  Palette,
  X
} from "lucide-react";

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

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isReading, setIsReading] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  // Initialize speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Select a default English voice
        const englishVoice = availableVoices.find(voice => 
          voice.lang.startsWith('en') && voice.default
        ) || availableVoices[0];
        
        if (englishVoice) {
          setSelectedVoice(englishVoice.name);
        }
      };

      loadVoices();
      speechSynthesis.addEventListener('voiceschanged', loadVoices);

      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    applyAccessibilitySettings(settings);
  }, [settings]);

  const applyAccessibilitySettings = (newSettings: AccessibilitySettings) => {
    console.log('Applying accessibility settings:', newSettings);
    const root = document.documentElement;
    
    // Apply dyslexia-friendly font
    if (newSettings.dyslexiaFont) {
      root.style.setProperty('--font-family', '"Trebuchet MS", "Verdana", "Arial", sans-serif');
      document.body.classList.add('dyslexia-friendly');
    } else {
      root.style.removeProperty('--font-family');
      document.body.classList.remove('dyslexia-friendly');
    }
    
    // Apply font size
    root.style.setProperty('--accessibility-font-size', `${newSettings.fontSize}px`);
    
    // Apply line height
    root.style.setProperty('--accessibility-line-height', newSettings.lineHeight.toString());
    
    // Apply letter spacing
    root.style.setProperty('--accessibility-letter-spacing', `${newSettings.letterSpacing}px`);
    
    // Apply high contrast mode
    if (newSettings.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    // Apply color theme - remove all theme classes first
    document.body.classList.remove('theme-sepia', 'theme-dark', 'theme-blue');
    if (newSettings.colorTheme !== 'default') {
      document.body.classList.add(`theme-${newSettings.colorTheme}`);
    }
    
    // Apply focus mode
    if (newSettings.focusMode) {
      document.body.classList.add('focus-mode');
    } else {
      document.body.classList.remove('focus-mode');
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !settings.textToSpeech) return;

    // Stop current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = settings.voiceRate;
    utterance.pitch = settings.voicePitch;
    
    utterance.onstart = () => {
      setIsReading(true);
      setCurrentUtterance(utterance);
    };
    
    utterance.onend = () => {
      setIsReading(false);
      setCurrentUtterance(null);
    };
    
    utterance.onerror = () => {
      setIsReading(false);
      setCurrentUtterance(null);
    };

    speechSynthesis.speak(utterance);
  };

  const stopReading = () => {
    speechSynthesis.cancel();
    setIsReading(false);
    setCurrentUtterance(null);
  };

  const pauseReading = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.pause();
    }
  };

  const resumeReading = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  };

  const readPageContent = () => {
    const content = document.querySelector('main')?.textContent || 
                   document.body.textContent || '';
    
    // Clean up the text
    const cleanText = content
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:]/g, '')
      .trim();
    
    if (cleanText) {
      speakText(cleanText);
    }
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    console.log(`Accessibility setting changed: ${key}`, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            className="fixed top-20 right-0 h-[calc(100vh-5rem)] w-96 max-w-[90vw] bg-white dark:bg-gray-900 shadow-2xl z-40 overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Accessibility className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Accessibility
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Text-to-Speech Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Text-to-Speech
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Enable TTS</span>
                    <Switch
                      checked={settings.textToSpeech}
                      onCheckedChange={(checked) => updateSetting('textToSpeech', checked)}
                    />
                  </div>

                  {settings.textToSpeech && (
                    <>
                      {/* Voice Controls */}
                      <div className="flex gap-2">
                        <Button
                          onClick={readPageContent}
                          disabled={isReading}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Read Page
                        </Button>
                        
                        {isReading && (
                          <Button
                            onClick={stopReading}
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-50"
                          >
                            <VolumeX className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Voice Selection */}
                      {voices.length > 0 && (
                        <div>
                          <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
                            Voice
                          </label>
                          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select voice" />
                            </SelectTrigger>
                            <SelectContent>
                              {voices.map((voice) => (
                                <SelectItem key={voice.name} value={voice.name}>
                                  {voice.name} ({voice.lang})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Speech Rate */}
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
                          Speech Rate: {settings.voiceRate}x
                        </label>
                        <Slider
                          value={[settings.voiceRate]}
                          onValueChange={(value) => updateSetting('voiceRate', value[0])}
                          min={0.5}
                          max={2}
                          step={0.1}
                          className="w-full"
                        />
                      </div>

                      {/* Speech Pitch */}
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
                          Speech Pitch: {settings.voicePitch}x
                        </label>
                        <Slider
                          value={[settings.voicePitch]}
                          onValueChange={(value) => updateSetting('voicePitch', value[0])}
                          min={0.5}
                          max={2}
                          step={0.1}
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Auto-read new content</span>
                        <Switch
                          checked={settings.autoRead}
                          onCheckedChange={(checked) => updateSetting('autoRead', checked)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Visual Settings Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Visual Settings
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Dyslexia-friendly font</span>
                    <Switch
                      checked={settings.dyslexiaFont}
                      onCheckedChange={(checked) => updateSetting('dyslexiaFont', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">High contrast</span>
                    <Switch
                      checked={settings.highContrast}
                      onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Focus mode</span>
                    <Switch
                      checked={settings.focusMode}
                      onCheckedChange={(checked) => updateSetting('focusMode', checked)}
                    />
                  </div>

                  {/* Color Theme */}
                  <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
                      Color Theme
                    </label>
                    <Select value={settings.colorTheme} onValueChange={(value: any) => updateSetting('colorTheme', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="sepia">Sepia</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="blue">Blue Light Filter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Typography Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Type className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Typography
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Font Size */}
                  <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
                      Font Size: {settings.fontSize}px
                    </label>
                    <Slider
                      value={[settings.fontSize]}
                      onValueChange={(value) => updateSetting('fontSize', value[0])}
                      min={12}
                      max={24}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Line Height */}
                  <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
                      Line Height: {settings.lineHeight}
                    </label>
                    <Slider
                      value={[settings.lineHeight]}
                      onValueChange={(value) => updateSetting('lineHeight', value[0])}
                      min={1.2}
                      max={2.5}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Letter Spacing */}
                  <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
                      Letter Spacing: {settings.letterSpacing}px
                    </label>
                    <Slider
                      value={[settings.letterSpacing]}
                      onValueChange={(value) => updateSetting('letterSpacing', value[0])}
                      min={0}
                      max={3}
                      step={0.5}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <Button
                onClick={() => setSettings(defaultSettings)}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Reset to Defaults
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}