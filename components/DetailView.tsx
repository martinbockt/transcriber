"use client";

import { useState, useEffect, forwardRef } from 'react';
import { ChevronDown, ChevronUp, Trash2, Download, Edit2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { TodoView } from './TodoView';
import { ResearchView } from './ResearchView';
import { DraftView } from './DraftView';
import { AudioPlayer, AudioPlayerRef } from './AudioPlayer';
import { ExportDialog } from './ExportDialog';
import type { VoiceItem } from '@/types/voice-item';

interface DetailViewProps {
  item: VoiceItem;
  onToggleTodo?: (itemId: string, todoIndex: number) => void;
  onDelete?: (itemId: string) => void;
  onUpdateTitle?: (itemId: string, newTitle: string) => void;
  onUpdateSummary?: (itemId: string, newSummary: string) => void;
  onUpdateTranscript?: (itemId: string, newTranscript: string) => void;
}

const intentLabels = {
  TODO: 'To-Do',
  RESEARCH: 'Research',
  DRAFT: 'Draft',
  NOTE: 'Note',
};

const intentVariants = {
  TODO: 'todo',
  RESEARCH: 'research',
  DRAFT: 'draft',
  NOTE: 'note',
} as const;

const intentBorderColors = {
  TODO: 'border-l-[hsl(var(--intent-todo))]',
  RESEARCH: 'border-l-[hsl(var(--intent-research))]',
  DRAFT: 'border-l-[hsl(var(--intent-draft))]',
  NOTE: 'border-l-[hsl(var(--intent-note))]',
} as const;

export const DetailView = forwardRef<AudioPlayerRef, DetailViewProps>(
  function DetailView({
    item,
    onToggleTodo,
    onDelete,
    onUpdateTitle,
    onUpdateSummary,
    onUpdateTranscript
  }, ref) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState(item.summary);
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(item.originalTranscript);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track unsaved changes in transcript
  useEffect(() => {
    if (isEditingTranscript && editedTranscript !== item.originalTranscript) {
      setHasUnsavedChanges(true);
    } else if (!isEditingTranscript) {
      setHasUnsavedChanges(false);
    }
  }, [isEditingTranscript, editedTranscript, item.originalTranscript]);

  const handleSaveTranscript = () => {
    onUpdateTranscript?.(item.id, editedTranscript);
    setIsEditingTranscript(false);
    setHasUnsavedChanges(false);
  };

  const handleCancelTranscript = () => {
    setEditedTranscript(item.originalTranscript);
    setIsEditingTranscript(false);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fadeIn">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-2">
            {isEditingTitle ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onUpdateTitle?.(item.id, editedTitle);
                    setIsEditingTitle(false);
                  } else if (e.key === 'Escape') {
                    setEditedTitle(item.title);
                    setIsEditingTitle(false);
                  }
                }}
                onBlur={() => {
                  onUpdateTitle?.(item.id, editedTitle);
                  setIsEditingTitle(false);
                }}
                autoFocus
                className="text-3xl font-bold h-auto py-1"
              />
            ) : (
              <h1
                className="text-3xl font-bold cursor-pointer hover:text-primary/80 transition-colors"
                onClick={() => setIsEditingTitle(true)}
              >
                {editedTitle}
              </h1>
            )}
            <div className="flex items-center gap-2">
              <Badge variant={intentVariants[item.intent]}>
                {intentLabels[item.intent]}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowExportDialog(true)}
              >
                <Download className="h-4 w-4" />
              </Button>
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Recording?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete &ldquo;{item.title}&rdquo; and all associated data.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(item.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground mb-3">
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {item.tags.map((tag) => (
                <Badge key={`${item.id}-${tag}`} variant="tag" className="text-xs font-medium">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {item.audioData ? (
            <AudioPlayer ref={ref} audioData={item.audioData} className="mb-2" />
          ) : (
            <p className="text-xs text-muted-foreground italic mb-2">
              No audio available for this recording
            </p>
          )}
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500 mt-2">
              <div className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-500 animate-pulse" />
              <span className="font-medium">Unsaved changes</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Summary & Key Facts */}
        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditingSummary ? (
                <Textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setEditedSummary(item.summary);
                      setIsEditingSummary(false);
                    }
                  }}
                  onBlur={() => {
                    onUpdateSummary?.(item.id, editedSummary);
                    setIsEditingSummary(false);
                  }}
                  autoFocus
                  className="text-sm leading-relaxed min-h-[100px]"
                />
              ) : (
                <p
                  className="text-sm leading-relaxed cursor-pointer hover:text-primary/80 transition-colors"
                  onClick={() => setIsEditingSummary(true)}
                >
                  {editedSummary}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Key Facts */}
          {item.keyFacts.length > 0 && (
            <Card className={`border-l-4 ${intentBorderColors[item.intent]}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold tracking-tight">Key Facts</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {item.keyFacts.map((fact, index) => (
                    <p key={`${item.id}-fact-${index}`} className="text-sm leading-relaxed">
                      {fact}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Intent-Specific Content */}
        {item.intent === 'TODO' && (
          <TodoView
            item={item}
            onToggleTodo={(todoIndex) => onToggleTodo?.(item.id, todoIndex)}
          />
        )}
        {item.intent === 'RESEARCH' && <ResearchView item={item} />}
        {item.intent === 'DRAFT' && <DraftView item={item} />}

        {/* Original Transcript */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <Button
                variant="ghost"
                className="flex-1 justify-between p-0 h-auto hover:bg-transparent"
                onClick={() => setShowTranscript(!showTranscript)}
              >
                <CardTitle className="text-lg">Original Transcript</CardTitle>
                {showTranscript ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
              {showTranscript && !isEditingTranscript && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingTranscript(true)}
                  className="ml-2"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          {showTranscript && (
            <CardContent>
              {isEditingTranscript ? (
                <div className="space-y-3">
                  <Textarea
                    value={editedTranscript}
                    onChange={(e) => setEditedTranscript(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        handleCancelTranscript();
                      }
                    }}
                    autoFocus
                    className="text-sm leading-relaxed min-h-[200px] font-mono"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveTranscript}
                      size="sm"
                      variant="default"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelTranscript}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {editedTranscript}
                </p>
              )}

            </CardContent>
          )}
        </Card>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        items={[item]}
      />
    </div>
  );
});
