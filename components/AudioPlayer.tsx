"use client";

import { forwardRef, useImperativeHandle } from "react";
import { Play, Pause, SkipBack, SkipForward, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

interface AudioPlayerProps {
  audioData: string;
  className?: string;
}

export interface AudioPlayerRef {
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  isPlaying: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  function AudioPlayer({ audioData, className }, ref) {
    const {
      isPlaying,
      currentTime,
      duration,
      play,
      pause,
      seek,
      skipForward,
      skipBackward,
      error,
    } = useAudioPlayer();

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        play: () => play(audioData),
        pause,
        togglePlayPause: () => {
          if (isPlaying) {
            pause();
          } else {
            play(audioData);
          }
        },
        skipForward,
        skipBackward,
        isPlaying,
      }),
      [isPlaying, play, pause, skipForward, skipBackward, audioData]
    );

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
    skipBackward(10);
  };

  const handleSkipForward = () => {
    skipForward(10);
  };
    
  const handleDownload = () => {
    try {
      // Extract MIME type and extension from data URL
      const mimeMatch = audioData.match(/^data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : "audio/webm";

      // Determine file extension based on MIME type
      const extension = mimeType.includes("mp4") ? "mp4" : "webm";

      // Convert base64 to blob
      const base64Data = audioData.split(",")[1];
      const binaryData = atob(base64Data);
      const arrayBuffer = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        arrayBuffer[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([arrayBuffer], { type: mimeType });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `recording-${Date.now()}.${extension}`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    }
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
          
          <Button
            onClick={handleDownload}
            className="h-9 w-9 p-0 rounded-full hover:bg-primary/10 transition-colors"
          >
            <Download className="h-4 w-4" />
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
});
