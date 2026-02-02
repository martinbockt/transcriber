"use client";

import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

interface AudioPlayerProps {
  audioData: string;
  className?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ audioData, className }: AudioPlayerProps) {
  const { isPlaying, currentTime, duration, play, pause, seek, error } =
    useAudioPlayer();

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play(audioData);
    }
  };

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  const handleSkipBack = () => {
    seek(Math.max(0, currentTime - 10));
  };

  const handleSkipForward = () => {
    seek(Math.min(duration, currentTime + 10));
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={className}>
      <div className="bg-muted/30 border border-border rounded-lg p-3 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkipBack}
            className="h-9 w-9 p-0 rounded-full hover:bg-primary/10 transition-colors"
            disabled={!duration}
          >
            <SkipBack className="h-4 w-4 fill-current" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayPause}
            className="h-9 w-9 p-0 rounded-full hover:bg-primary/10 transition-colors"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 ml-0.5 fill-current" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkipForward}
            className="h-9 w-9 p-0 rounded-full hover:bg-primary/10 transition-colors"
            disabled={!duration}
          >
            <SkipForward className="h-4 w-4 fill-current" />
          </Button>

          <div className="flex-1 space-y-1.5">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
              disabled={!duration}
            />
            <div className="flex justify-between text-xs text-muted-foreground font-medium tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>{duration ? formatTime(duration) : "--:--"}</span>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive mt-2 font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
