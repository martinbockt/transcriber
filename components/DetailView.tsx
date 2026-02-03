'use client';

import type { VoiceItem } from '@/types/voice-item';
import { ChevronDown, ChevronUp, Trash2, Download, Edit2, Check, Copy } from 'lucide-react';
import { useTranslation } from '@/components/language-provider';
import { useEffect, useState, forwardRef } from 'react';
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

export const DetailView = forwardRef<AudioPlayerRef, DetailViewProps>(function DetailView(
  { item, onToggleTodo, onDelete, onUpdateTitle, onUpdateSummary, onUpdateTranscript },
  ref,
) {
  const { dictionary: appDictionary, locale } = useTranslation();
  const [localDictionary, setLocalDictionary] = useState(appDictionary);

  useEffect(() => {
    async function loadDict() {
      if (item.language && (item.language === 'en' || item.language === 'de')) {
        const dict = await import(`@/dictionaries/${item.language}.json`);
        setLocalDictionary(dict.default || dict);
      } else {
        setLocalDictionary(appDictionary);
      }
    }
    loadDict();
  }, [item.language, appDictionary]);

  const dictionary = localDictionary;

  const [showTranscript, setShowTranscript] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState(item.summary);
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(item.originalTranscript);
  const [hasCopied, setHasCopied] = useState(false);

  const hasUnsavedChanges = isEditingTranscript && editedTranscript !== item.originalTranscript;

  const handleSaveTranscript = () => {
    onUpdateTranscript?.(item.id, editedTranscript);
    setIsEditingTranscript(false);
  };

  const handleCancelTranscript = () => {
    setEditedTranscript(item.originalTranscript);
    setIsEditingTranscript(false);
  };

  const handleCopyTranscript = async () => {
    if (editedTranscript) {
      await navigator.clipboard.writeText(editedTranscript);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="animate-fadeIn mx-auto max-w-4xl space-y-4 p-4 sm:space-y-6 sm:p-6 lg:p-8">
        {/* Header */}
        <div>
          <div className="mb-2 flex items-start justify-between">
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
                className="h-auto py-1 text-3xl font-bold"
              />
            ) : (
              <h1
                className="decoration-primary/50 cursor-pointer text-3xl font-bold decoration-dashed underline-offset-4 transition-all hover:underline"
                onClick={() => setIsEditingTitle(true)}
              >
                {editedTitle}
              </h1>
            )}
            <div className="flex items-center gap-2">
              <Badge variant={intentVariants[item.intent]}>{intentLabels[item.intent]}</Badge>
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
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{dictionary.detailView.deleteTitle}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {dictionary.detailView.deleteConfirm.replace('{title}', item.title)}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{dictionary.common.cancel}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(item.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {dictionary.common.delete}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <div className="text-muted-foreground mb-3 text-sm">
            {new Date(item.createdAt).toLocaleDateString(locale, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          {item.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
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
            <p className="text-muted-foreground mb-2 text-xs italic">
              {dictionary.detailView.noAudio}
            </p>
          )}
          {hasUnsavedChanges && (
            <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
              <div className="h-2 w-2 animate-pulse rounded-full bg-amber-600 dark:bg-amber-500" />
              <span className="font-medium">Unsaved changes</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Summary & Key Facts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[65%_35%]">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{dictionary.detailView.summary}</CardTitle>
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
                  className="min-h-[100px] text-sm leading-relaxed"
                />
              ) : (
                <p
                  className="hover:bg-muted/50 -m-1 cursor-pointer rounded p-1 text-sm leading-relaxed transition-colors"
                  onClick={() => setIsEditingSummary(true)}
                >
                  {editedSummary}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Key Facts */}
          {item.keyFacts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold tracking-tight">
                  {dictionary.detailView.keyFacts}
                </CardTitle>
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
          <TodoView item={item} onToggleTodo={(todoIndex) => onToggleTodo?.(item.id, todoIndex)} />
        )}
        {item.intent === 'RESEARCH' && <ResearchView item={item} />}
        {item.intent === 'DRAFT' && <DraftView item={item} />}

        {/* Original Transcript */}
        <Card>
          <CardHeader>
            <div className="flex w-full items-center justify-between">
              <Button
                variant="ghost"
                className="hover:bg-muted/50 hover:text-foreground -ml-2 h-auto flex-1 justify-between rounded-md p-2 transition-colors"
                onClick={() => setShowTranscript(!showTranscript)}
              >
                <CardTitle className="text-lg">
                  {dictionary.detailView.originalTranscript}
                </CardTitle>
                {showTranscript ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
              <div className="flex items-center gap-1">
                {showTranscript && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyTranscript();
                    }}
                    className="h-8 w-8 p-0"
                  >
                    {hasCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
                {showTranscript && !isEditingTranscript && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingTranscript(true)}
                    className="ml-2"
                  >
                    <Edit2 className="mr-1 h-4 w-4" />
                    {dictionary.detailView.edit}
                  </Button>
                )}
              </div>
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
                    className="min-h-[200px] font-mono text-sm leading-relaxed"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveTranscript} size="sm" variant="default">
                      <Check className="mr-1 h-4 w-4" />
                      {dictionary.common.save}
                    </Button>
                    <Button onClick={handleCancelTranscript} size="sm" variant="outline">
                      {dictionary.common.cancel}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {editedTranscript}
                </p>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* Export Dialog */}
      <ExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} items={[item]} />
    </div>
  );
});
