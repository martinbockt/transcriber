'use client';

import { Mic, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  onNewRecording?: () => void;
}

export function EmptyState({ onNewRecording }: EmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="animate-fadeIn max-w-md space-y-6 text-center">
        <div className="relative inline-flex">
          <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-2xl" />
          <div className="from-primary/10 to-accent/10 relative rounded-full bg-linear-to-br p-6">
            <Mic className="text-primary h-12 w-12" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="flex items-center justify-center gap-2 text-2xl font-bold tracking-tight">
            No Recording Selected
            <Sparkles className="text-accent h-5 w-5" />
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Select a recording from the sidebar to view details, or create a new one to get started
            with AI-powered transcription and analysis.
          </p>
        </div>

        {onNewRecording && (
          <div className="pt-4">
            <Button onClick={onNewRecording} size="lg" className="gap-2">
              <Mic className="h-5 w-5" />
              Start New Recording
            </Button>
          </div>
        )}

        <div className="space-y-2 pt-4">
          <p className="text-muted-foreground text-xs font-medium">Quick Tips</p>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="bg-muted/30 space-y-1 rounded-lg p-3">
              <p className="text-xs font-semibold">⌘ + N</p>
              <p className="text-muted-foreground text-xs">New Recording</p>
            </div>
            <div className="bg-muted/30 space-y-1 rounded-lg p-3">
              <p className="text-xs font-semibold">⌘ + /</p>
              <p className="text-muted-foreground text-xs">Shortcuts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
