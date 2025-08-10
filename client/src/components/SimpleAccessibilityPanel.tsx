import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAccessibility } from "@/hooks/useAccessibility";
import { 
  Accessibility, 
  Volume2, 
  VolumeX, 
  Play,
  Type,
  Eye,
  X
} from "lucide-react";

interface SimpleAccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleAccessibilityPanel({ isOpen, onClose }: SimpleAccessibilityPanelProps) {
  const {
    settings,
    isReading,
    updateSettings,
    startTextToSpeech,
    stopTextToSpeech
  } = useAccessibility();

  const handleReadPage = () => {
    startTextToSpeech();
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
                      onCheckedChange={(checked) => updateSettings({ textToSpeech: checked })}
                    />
                  </div>

                  {settings.textToSpeech && (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleReadPage}
                        disabled={isReading}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Read Page
                      </Button>
                      
                      {isReading && (
                        <Button
                          onClick={stopTextToSpeech}
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-50"
                        >
                          <VolumeX className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}

                  {settings.textToSpeech && (
                    <div>
                      <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
                        Reading Speed: {settings.readingSpeed}x
                      </label>
                      <Slider
                        value={[settings.readingSpeed]}
                        onValueChange={(value) => updateSettings({ readingSpeed: value[0] })}
                        min={0.5}
                        max={2}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Section */}
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
                      onCheckedChange={(checked) => updateSettings({ dyslexiaFont: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">High contrast</span>
                    <Switch
                      checked={settings.highContrast}
                      onCheckedChange={(checked) => updateSettings({ highContrast: checked })}
                    />
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
                      onValueChange={(value) => updateSettings({ fontSize: value[0] })}
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
                      onValueChange={(value) => updateSettings({ lineHeight: value[0] })}
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
                      onValueChange={(value) => updateSettings({ letterSpacing: value[0] })}
                      min={0}
                      max={3}
                      step={0.5}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Keyboard Shortcuts
                </h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>Alt + S: Start/Stop reading</li>
                  <li>Alt + P: Pause/Resume reading</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}