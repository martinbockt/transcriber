"use client";

import { Mic, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  onNewRecording?: () => void;
}

export function EmptyState({ onNewRecording }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6 animate-fadeIn">
        <div className="relative inline-flex">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-full">
            <Mic className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight flex items-center justify-center gap-2">
            No Recording Selected
            <Sparkles className="h-5 w-5 text-accent" />
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Select a recording from the sidebar to view details, or create a new one to get started with AI-powered transcription and analysis.
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

        <div className="pt-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Quick Tips</p>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold">⌘ + N</p>
              <p className="text-xs text-muted-foreground">New Recording</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold">⌘ + /</p>
              <p className="text-xs text-muted-foreground">Shortcuts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
