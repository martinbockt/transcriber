"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, X, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  TODO: 'default',
  RESEARCH: 'secondary',
  DRAFT: 'secondary',
  NOTE: 'outline',
} as const;

export function DetailView({ item, onToggleTodo, onDelete }: DetailViewProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title);
  const [tags, setTags] = useState<string[]>(item.tags);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-2">
            {isEditingTitle ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTitle(false);
                  } else if (e.key === 'Escape') {
                    setEditedTitle(item.title);
                    setIsEditingTitle(false);
                  }
                }}
                onBlur={() => {
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
          {item.audioData ? (
            <AudioPlayer audioData={item.audioData} className="mb-2" />
          ) : (
            <p className="text-xs text-muted-foreground italic mb-2">
              No audio available for this recording
            </p>
          )}
        </div>

        <Separator />

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{item.summary}</p>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="group pr-1">
                    <span className="mr-1">{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="inline-flex items-center justify-center rounded-full hover:bg-secondary-foreground/20 transition-colors"
                      aria-label={`Remove ${tag} tag`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag..."
                  className="text-sm"
                />
                <Button
                  onClick={handleAddTag}
                  size="sm"
                  variant="secondary"
                  className="shrink-0"
                  disabled={!newTag.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Facts */}
        {item.keyFacts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Key Facts</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {item.keyFacts.map((fact, index) => (
                  <li key={index} className="text-sm flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

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
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
              onClick={() => setShowTranscript(!showTranscript)}
            >
              <CardTitle className="text-lg">Original Transcript</CardTitle>
              {showTranscript ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </CardHeader>
          {showTranscript && (
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {item.originalTranscript}
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
