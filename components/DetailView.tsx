"use client";

import { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
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
import { AudioPlayer } from './AudioPlayer';
import type { VoiceItem } from '@/types/voice-item';

interface DetailViewProps {
  item: VoiceItem;
  onToggleTodo?: (itemId: string, todoIndex: number) => void;
  onDelete?: (itemId: string) => void;
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

export function DetailView({ item, onToggleTodo, onDelete }: DetailViewProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fadeIn">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{item.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={intentVariants[item.intent]}>
                {intentLabels[item.intent]}
              </Badge>
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
            <AudioPlayer audioData={item.audioData} className="mb-2" />
          ) : (
            <p className="text-xs text-muted-foreground italic mb-2">
              No audio available for this recording
            </p>
          )}
        </div>

        <Separator />

        {/* Summary and Key Facts Side by Side */}
        <div className={`grid gap-4 sm:gap-6 ${item.keyFacts.length > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Summary */}
          <Card className={`border-l-4 ${intentBorderColors[item.intent]}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold tracking-tight">Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
            </CardContent>
          </Card>

          {/* Key Facts */}
          {item.keyFacts.length > 0 && (
            <Card className={`border-l-4 ${intentBorderColors[item.intent]}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold tracking-tight">Key Facts</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableBody>
                    {item.keyFacts.map((fact, index) => (
                      <TableRow key={`${item.id}-fact-${index}`}>
                        <TableCell className="font-semibold text-primary/70 w-16 text-center">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-xs">
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm leading-relaxed">{fact}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
        <Card className="border-l-4 border-l-muted-foreground/20">
          <CardHeader className="pb-3">
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent -mx-1 px-1 rounded-md"
              onClick={() => setShowTranscript(!showTranscript)}
            >
              <CardTitle className="text-lg font-semibold tracking-tight">Original Transcript</CardTitle>
              <div className={`transition-transform duration-200 ${showTranscript ? 'rotate-180' : ''}`}>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </div>
            </Button>
          </CardHeader>
          {showTranscript && (
            <CardContent className="pt-0">
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono">
                  {item.originalTranscript}
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
