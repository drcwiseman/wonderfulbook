import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Settings, 
  Headphones,
  BookOpen,
  Mic
} from 'lucide-react';
import { useBookTTS } from '@/hooks/useBookTTS';

interface BookTTSControlsProps {
  bookId: string;
  currentPageText?: string;
  selectedText?: string;
  className?: string;
}

export default function BookTTSControls({ 
  bookId, 
  currentPageText = '', 
  selectedText = '',
  className = '' 
}: BookTTSControlsProps) {
  const {
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
  } = useBookTTS(bookId);

  const [showSettings, setShowSettings] = React.useState(false);
  const progress = getReadingProgress();

  const handleReadSelection = () => {
    if (selectedText.trim()) {
      startReading(selectedText);
    }
  };

  const handleReadPage = () => {
    if (currentPageText.trim()) {
      startReading(currentPageText);
    }
  };

  const handlePlayPause = () => {
    if (state.isReading && !state.isPaused) {
      pauseReading();
    } else if (state.isPaused) {
      resumeReading();
    } else {
      // Start reading current page if no text is selected
      handleReadPage();
    }
  };

  if (!settings.enabled) {
    return (
      <Card className={`bg-white/95 backdrop-blur-sm border border-orange-200 ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">Text-to-Speech</span>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => updateSettings({ enabled })}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white/95 backdrop-blur-sm border border-orange-200 ${className}`}>
      <CardContent className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">Book Reader</span>
            {state.isReading && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                Reading
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-6 w-6 p-0"
            >
              <Settings className="w-3 h-3" />
            </Button>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => updateSettings({ enabled })}
              className="data-[state=checked]:bg-orange-500 scale-75"
            />
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center gap-2">
          {/* Text Selection Controls */}
          <div className="flex gap-1">
            {selectedText && (
              <Button
                onClick={handleReadSelection}
                disabled={state.isReading}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white h-7 px-2 text-xs"
              >
                <Mic className="w-3 h-3 mr-1" />
                Read Selection
              </Button>
            )}
            <Button
              onClick={handleReadPage}
              disabled={state.isReading}
              size="sm"
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50 h-7 px-2 text-xs"
            >
              <BookOpen className="w-3 h-3 mr-1" />
              Read Page
            </Button>
          </div>

          {/* Playback Controls */}
          {state.isReading && (
            <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
              <Button
                onClick={skipToPrevious}
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                disabled={state.currentSentenceIndex === 0}
              >
                <SkipBack className="w-3 h-3" />
              </Button>
              
              <Button
                onClick={handlePlayPause}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white h-7 w-7 p-0"
              >
                {state.isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              </Button>
              
              <Button
                onClick={skipToNext}
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
              >
                <SkipForward className="w-3 h-3" />
              </Button>
              
              <Button
                onClick={stopReading}
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
              >
                <Square className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Reading Progress */}
        {state.isReading && progress.total > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Sentence {progress.current} of {progress.total}</span>
              <span>{progress.percentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t border-gray-200 pt-3 space-y-3">
            {/* Voice Selection */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Voice</label>
              <Select
                value={settings.voice}
                onValueChange={(voice) => updateSettings({ voice })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Voice</SelectItem>
                  {state.availableVoices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reading Speed */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-xs font-medium text-gray-700">Speed</label>
                <span className="text-xs text-gray-500">{settings.rate.toFixed(1)}x</span>
              </div>
              <Slider
                value={[settings.rate]}
                onValueChange={([rate]) => updateSettings({ rate })}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Volume */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  Volume
                </label>
                <span className="text-xs text-gray-500">{Math.round(settings.volume * 100)}%</span>
              </div>
              <Slider
                value={[settings.volume]}
                onValueChange={([volume]) => updateSettings({ volume })}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Additional Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700">Highlight text</span>
                <Switch
                  checked={settings.highlightText}
                  onCheckedChange={(highlightText) => updateSettings({ highlightText })}
                  className="data-[state=checked]:bg-orange-500 scale-75"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700">Auto-read new pages</span>
                <Switch
                  checked={settings.autoRead}
                  onCheckedChange={(autoRead) => updateSettings({ autoRead })}
                  className="data-[state=checked]:bg-orange-500 scale-75"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}