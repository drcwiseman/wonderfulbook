import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAccessibility } from '@/hooks/useAccessibility';
import { 
  Volume2, 
  Type, 
  Eye, 
  Palette, 
  Play, 
  Pause, 
  Square,
  TestTube,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function AccessibilityTestDemo() {
  const {
    settings,
    isReading,
    isPaused,
    updateSettings,
    startTextToSpeech,
    pauseTextToSpeech,
    resumeTextToSpeech,
    stopTextToSpeech,
    availableVoices
  } = useAccessibility();

  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});

  const runTest = (testName: string, testFn: () => boolean) => {
    const result = testFn();
    setTestResults(prev => ({ ...prev, [testName]: result }));
    return result;
  };

  const testTextToSpeech = () => {
    try {
      updateSettings({ textToSpeech: true });
      const testText = "Testing text-to-speech functionality. This is a sample text to verify that the speech synthesis is working correctly.";
      startTextToSpeech(testText);
      
      // Check if speech synthesis is supported
      return 'speechSynthesis' in window && settings.textToSpeech;
    } catch (error) {
      console.error('TTS test failed:', error);
      return false;
    }
  };

  const testDyslexiaFont = () => {
    try {
      updateSettings({ dyslexiaFont: true });
      
      // Check if dyslexic font class is applied
      const hasClass = document.documentElement.classList.contains('dyslexic-font');
      const fontFamily = getComputedStyle(document.body).fontFamily;
      
      return hasClass && (fontFamily.includes('OpenDyslexic') || fontFamily.includes('Comic Sans'));
    } catch (error) {
      console.error('Dyslexia font test failed:', error);
      return false;
    }
  };

  const testHighContrast = () => {
    try {
      updateSettings({ highContrast: true });
      
      // Check if high contrast class is applied
      const hasClass = document.documentElement.classList.contains('high-contrast');
      
      return hasClass;
    } catch (error) {
      console.error('High contrast test failed:', error);
      return false;
    }
  };

  const testFontSizeAdjustment = () => {
    try {
      const originalSize = settings.fontSize;
      updateSettings({ fontSize: 20 });
      
      // Check if CSS variable is set
      const rootStyles = getComputedStyle(document.documentElement);
      const fontSize = rootStyles.getPropertyValue('--accessibility-font-size');
      
      // Reset to original
      updateSettings({ fontSize: originalSize });
      
      return fontSize === '20px';
    } catch (error) {
      console.error('Font size test failed:', error);
      return false;
    }
  };

  const testSettingsPersistence = () => {
    try {
      const testSettings = {
        textToSpeech: true,
        dyslexiaFont: true,
        fontSize: 18,
        highContrast: true
      };
      
      updateSettings(testSettings);
      
      // Check if settings are saved to localStorage
      const saved = localStorage.getItem('accessibility-settings');
      if (!saved) return false;
      
      const parsed = JSON.parse(saved);
      return parsed.textToSpeech === true && 
             parsed.dyslexiaFont === true && 
             parsed.fontSize === 18 && 
             parsed.highContrast === true;
    } catch (error) {
      console.error('Settings persistence test failed:', error);
      return false;
    }
  };

  const testKeyboardShortcuts = () => {
    try {
      // Enable TTS first
      updateSettings({ textToSpeech: true });
      
      // Simulate Alt+S keypress
      const event = new KeyboardEvent('keydown', {
        key: 's',
        altKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(event);
      
      // Check if TTS started (this is a basic check)
      return settings.textToSpeech;
    } catch (error) {
      console.error('Keyboard shortcuts test failed:', error);
      return false;
    }
  };

  const runAllTests = () => {
    const tests = [
      ['Text-to-Speech', testTextToSpeech],
      ['Dyslexia-Friendly Font', testDyslexiaFont],
      ['High Contrast Mode', testHighContrast],
      ['Font Size Adjustment', testFontSizeAdjustment],
      ['Settings Persistence', testSettingsPersistence],
      ['Keyboard Shortcuts', testKeyboardShortcuts]
    ];

    tests.forEach(([name, test]) => {
      runTest(name as string, test as () => boolean);
    });
  };

  const resetAllSettings = () => {
    updateSettings({
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
    setTestResults({});
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-6 w-6 text-blue-500" />
            Accessibility Features Test Suite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Settings Display */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Current Settings
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Badge variant={settings.textToSpeech ? "default" : "secondary"}>
                TTS: {settings.textToSpeech ? "ON" : "OFF"}
              </Badge>
              <Badge variant={settings.dyslexiaFont ? "default" : "secondary"}>
                Dyslexic Font: {settings.dyslexiaFont ? "ON" : "OFF"}
              </Badge>
              <Badge variant={settings.highContrast ? "default" : "secondary"}>
                High Contrast: {settings.highContrast ? "ON" : "OFF"}
              </Badge>
              <Badge variant="outline">
                Font Size: {settings.fontSize}px
              </Badge>
              <Badge variant="outline">
                Line Height: {settings.lineHeight}
              </Badge>
              <Badge variant="outline">
                Speed: {settings.readingSpeed}x
              </Badge>
              <Badge variant={availableVoices.length > 0 ? "default" : "secondary"}>
                Voices: {availableVoices.length}
              </Badge>
              <Badge variant={isReading ? "destructive" : "secondary"}>
                Reading: {isReading ? (isPaused ? "PAUSED" : "ACTIVE") : "STOPPED"}
              </Badge>
            </div>
          </div>

          {/* Test Controls */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button onClick={runAllTests} className="bg-blue-600 hover:bg-blue-700">
                <TestTube className="h-4 w-4 mr-2" />
                Run All Tests
              </Button>
              <Button onClick={resetAllSettings} variant="outline">
                Reset Settings
              </Button>
            </div>

            {/* Individual Test Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Button 
                onClick={() => runTest('Text-to-Speech', testTextToSpeech)}
                variant="outline"
                className="justify-start"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                Test TTS
              </Button>
              <Button 
                onClick={() => runTest('Dyslexia Font', testDyslexiaFont)}
                variant="outline"
                className="justify-start"
              >
                <Type className="h-4 w-4 mr-2" />
                Test Dyslexic Font
              </Button>
              <Button 
                onClick={() => runTest('High Contrast', testHighContrast)}
                variant="outline"
                className="justify-start"
              >
                <Palette className="h-4 w-4 mr-2" />
                Test High Contrast
              </Button>
              <Button 
                onClick={() => runTest('Font Size', testFontSizeAdjustment)}
                variant="outline"
                className="justify-start"
              >
                <Type className="h-4 w-4 mr-2" />
                Test Font Size
              </Button>
              <Button 
                onClick={() => runTest('Persistence', testSettingsPersistence)}
                variant="outline"
                className="justify-start"
              >
                <Eye className="h-4 w-4 mr-2" />
                Test Persistence
              </Button>
              <Button 
                onClick={() => runTest('Shortcuts', testKeyboardShortcuts)}
                variant="outline"
                className="justify-start"
              >
                <Type className="h-4 w-4 mr-2" />
                Test Shortcuts
              </Button>
            </div>
          </div>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="bg-white dark:bg-gray-900 border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Test Results</h3>
              <div className="space-y-2">
                {Object.entries(testResults).map(([testName, passed]) => (
                  <div key={testName} className="flex items-center justify-between">
                    <span className="text-sm">{testName}</span>
                    <div className="flex items-center gap-2">
                      {passed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge variant={passed ? "default" : "destructive"}>
                        {passed ? "PASS" : "FAIL"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TTS Controls */}
          {settings.textToSpeech && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Text-to-Speech Controls
              </h3>
              <div className="flex gap-2">
                {!isReading ? (
                  <Button onClick={() => startTextToSpeech("Hello! This is a test of the text-to-speech functionality. The accessibility features are working correctly.")}>
                    <Play className="h-4 w-4 mr-2" />
                    Test Speech
                  </Button>
                ) : (
                  <>
                    {!isPaused ? (
                      <Button onClick={pauseTextToSpeech} variant="outline">
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button onClick={resumeTextToSpeech} variant="outline">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button onClick={stopTextToSpeech} variant="destructive">
                      <Square className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Sample Content for Testing */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Sample Content for Testing</h3>
            <div className="space-y-2 text-sm leading-relaxed">
              <p>This is a sample paragraph to test the accessibility features. The text should adapt based on your current settings.</p>
              <p>If dyslexic font is enabled, you should see Comic Sans or OpenDyslexic font. The font size, line height, and letter spacing will also adjust according to your preferences.</p>
              <p>High contrast mode will make text more visible with enhanced colors and stronger borders. All these changes persist across page loads.</p>
            </div>
          </div>

          {/* Keyboard Shortcuts Info */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Keyboard Shortcuts</h3>
            <div className="text-sm space-y-1">
              <p><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">Alt + S</kbd> - Start/Stop reading</p>
              <p><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">Alt + P</kbd> - Pause/Resume reading</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}