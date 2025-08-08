import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { 
  Volume2, 
  VolumeX, 
  Type, 
  Eye, 
  Palette,
  Settings,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  AccessibilityIcon
} from 'lucide-react';

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

interface AccessibilityMenuProps {
  onSettingsChange?: (settings: AccessibilitySettings) => void;
}

export default function AccessibilityMenu({ onSettingsChange }: AccessibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [settings, setSettings] = useState<AccessibilitySettings>({
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
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      applyAccessibilitySettings(parsed);
    }

    // Load available voices
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Apply accessibility settings to the document
  const applyAccessibilitySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // Font settings
    if (newSettings.dyslexiaFont) {
      root.style.setProperty('--font-family', '"OpenDyslexic", Arial, sans-serif');
    } else {
      root.style.removeProperty('--font-family');
    }

    // Font size
    root.style.setProperty('--font-size-base', `${newSettings.fontSize}px`);
    
    // Line height
    root.style.setProperty('--line-height-base', newSettings.lineHeight.toString());
    
    // Letter spacing
    root.style.setProperty('--letter-spacing-base', `${newSettings.letterSpacing}px`);

    // High contrast mode
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Dark mode
    if (newSettings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Text highlighting
    if (newSettings.highlightText) {
      root.classList.add('highlight-text');
    } else {
      root.classList.remove('highlight-text');
    }
  };

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('accessibility-settings', JSON.stringify(updated));
    applyAccessibilitySettings(updated);
    onSettingsChange?.(updated);
  };

  const getTextContent = (element: Element): string => {
    let text = '';
    
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        
        // Skip script, style, and hidden elements
        if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName) || 
            el.getAttribute('aria-hidden') === 'true' ||
            getComputedStyle(el).display === 'none') {
          continue;
        }
        
        text += getTextContent(el);
      }
    }
    
    return text;
  };

  const startTextToSpeech = () => {
    if (!settings.textToSpeech) return;

    // Stop any current speech
    speechSynthesis.cancel();

    // Get main content text (try to find main content area)
    const mainContent = document.querySelector('main') || 
                       document.querySelector('[role="main"]') || 
                       document.querySelector('.pdf-viewer') ||
                       document.body;

    if (!mainContent) return;

    const text = getTextContent(mainContent).trim();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure speech settings
    utterance.rate = settings.readingSpeed;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Set voice if available
    if (settings.voiceType !== 'default' && availableVoices.length > 0) {
      const selectedVoice = availableVoices.find(voice => 
        voice.name === settings.voiceType || voice.lang === settings.voiceType
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    // Event handlers
    utterance.onstart = () => {
      setIsReading(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsReading(false);
      setIsPaused(false);
      setCurrentUtterance(null);
    };

    utterance.onerror = () => {
      setIsReading(false);
      setIsPaused(false);
      setCurrentUtterance(null);
    };

    setCurrentUtterance(utterance);
    speechSynthesis.speak(utterance);
  };

  const pauseTextToSpeech = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeTextToSpeech = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopTextToSpeech = () => {
    speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
    setCurrentUtterance(null);
  };

  const resetSettings = () => {
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
    
    updateSettings(defaultSettings);
  };

  return (
    <div className="accessibility-menu">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="fixed top-4 right-20 z-50 bg-white/90 backdrop-blur-sm border-2 hover:bg-gray-50"
            aria-label="Accessibility Options"
          >
            <AccessibilityIcon className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Accessibility</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          className="w-96 p-0 max-h-[80vh] overflow-y-auto" 
          align="end"
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AccessibilityIcon className="h-5 w-5" />
                Accessibility Settings
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Text-to-Speech Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-medium flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Text-to-Speech
                  </label>
                  <Switch
                    checked={settings.textToSpeech}
                    onCheckedChange={(checked) => updateSettings({ textToSpeech: checked })}
                  />
                </div>

                {settings.textToSpeech && (
                  <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                    {/* TTS Controls */}
                    <div className="flex gap-2">
                      {!isReading ? (
                        <Button size="sm" onClick={startTextToSpeech} className="flex-1">
                          <Play className="h-4 w-4 mr-1" />
                          Start Reading
                        </Button>
                      ) : (
                        <>
                          {!isPaused ? (
                            <Button size="sm" onClick={pauseTextToSpeech} variant="outline">
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button size="sm" onClick={resumeTextToSpeech} variant="outline">
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" onClick={stopTextToSpeech} variant="destructive">
                            <Square className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Reading Speed */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Reading Speed: {settings.readingSpeed}x
                      </label>
                      <Slider
                        value={[settings.readingSpeed]}
                        onValueChange={([value]) => updateSettings({ readingSpeed: value })}
                        min={0.5}
                        max={2}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    {/* Voice Selection */}
                    {availableVoices.length > 0 && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Voice</label>
                        <Select 
                          value={settings.voiceType} 
                          onValueChange={(value) => updateSettings({ voiceType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default Voice</SelectItem>
                            {availableVoices.slice(0, 5).map((voice) => (
                              <SelectItem key={voice.name} value={voice.name}>
                                {voice.name} ({voice.lang})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DropdownMenuSeparator />

              {/* Font & Reading Settings */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Font & Reading
                </h3>

                {/* Dyslexia-Friendly Font */}
                <div className="flex items-center justify-between">
                  <label className="text-sm">Dyslexia-Friendly Font</label>
                  <Switch
                    checked={settings.dyslexiaFont}
                    onCheckedChange={(checked) => updateSettings({ dyslexiaFont: checked })}
                  />
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Font Size: {settings.fontSize}px
                  </label>
                  <Slider
                    value={[settings.fontSize]}
                    onValueChange={([value]) => updateSettings({ fontSize: value })}
                    min={12}
                    max={24}
                    step={1}
                  />
                </div>

                {/* Line Height */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Line Height: {settings.lineHeight}
                  </label>
                  <Slider
                    value={[settings.lineHeight]}
                    onValueChange={([value]) => updateSettings({ lineHeight: value })}
                    min={1}
                    max={2}
                    step={0.1}
                  />
                </div>

                {/* Letter Spacing */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Letter Spacing: {settings.letterSpacing}px
                  </label>
                  <Slider
                    value={[settings.letterSpacing]}
                    onValueChange={([value]) => updateSettings({ letterSpacing: value })}
                    min={0}
                    max={3}
                    step={0.5}
                  />
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Visual Settings */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Visual Settings
                </h3>

                <div className="flex items-center justify-between">
                  <label className="text-sm">High Contrast Mode</label>
                  <Switch
                    checked={settings.highContrast}
                    onCheckedChange={(checked) => updateSettings({ highContrast: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm">Dark Mode</label>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => updateSettings({ darkMode: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm">Highlight Reading Text</label>
                  <Switch
                    checked={settings.highlightText}
                    onCheckedChange={(checked) => updateSettings({ highlightText: checked })}
                  />
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Reset Button */}
              <Button 
                onClick={resetSettings}
                variant="outline" 
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                {settings.textToSpeech && (
                  <Badge variant="secondary">TTS Enabled</Badge>
                )}
                {settings.dyslexiaFont && (
                  <Badge variant="secondary">Dyslexic Font</Badge>
                )}
                {settings.highContrast && (
                  <Badge variant="secondary">High Contrast</Badge>
                )}
                {settings.darkMode && (
                  <Badge variant="secondary">Dark Mode</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reading Status Indicator */}
      {isReading && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          <span>{isPaused ? 'Reading Paused' : 'Reading...'}</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-white hover:bg-blue-700"
            onClick={stopTextToSpeech}
          >
            <Square className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}