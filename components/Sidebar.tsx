"use client";

import { Mic, ListTodo, FileQuestion, FileEdit, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { VoiceItem, IntentType } from '@/types/voice-item';
import { cn } from '@/lib/utils';

interface SidebarProps {
  items: VoiceItem[];
  activeItemId: string | null;
  onSelectItem: (id: string) => void;
  onNewRecording: () => void;
  isRecording: boolean;
}

const intentIcons: Record<IntentType, typeof ListTodo> = {
  TODO: ListTodo,
  RESEARCH: FileQuestion,
  DRAFT: FileEdit,
  NOTE: StickyNote,
};

const intentColors: Record<IntentType, string> = {
  TODO: 'text-[hsl(var(--intent-todo))]',
  RESEARCH: 'text-[hsl(var(--intent-research))]',
  DRAFT: 'text-[hsl(var(--intent-draft))]',
  NOTE: 'text-[hsl(var(--intent-note))]',
};

const intentBorderColors: Record<IntentType, string> = {
  TODO: 'border-l-[hsl(var(--intent-todo))]',
  RESEARCH: 'border-l-[hsl(var(--intent-research))]',
  DRAFT: 'border-l-[hsl(var(--intent-draft))]',
  NOTE: 'border-l-[hsl(var(--intent-note))]',
};

export function Sidebar({
  items,
  activeItemId,
  onSelectItem,
  onNewRecording,
  isRecording,
}: SidebarProps) {
  return (
    <div className="w-80 border-r bg-muted/10 flex flex-col h-screen">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Voice Assistant</h1>
        <Button
          onClick={onNewRecording}
          disabled={isRecording}
          size="lg"
          className="w-full"
        >
          <Mic className={cn("mr-2 h-5 w-5", isRecording && "animate-pulse")} />
          {isRecording ? 'Recording...' : 'New Recording'}
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">No recordings yet</p>
              <p className="text-xs mt-1">Click the button above to start</p>
            </div>
          ) : (
            items.map((item) => {
              const Icon = intentIcons[item.intent];
              const isActive = item.id === activeItemId;

              return (
                <Card
                  key={item.id}
                  className={cn(
                    "p-3 cursor-pointer transition-all duration-200 hover:bg-accent border-l-2",
                    intentBorderColors[item.intent],
                    isActive && "bg-accent shadow-sm"
                  )}
                  onClick={() => onSelectItem(item.id)}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={cn("h-5 w-5 mt-0.5", intentColors[item.intent])} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-2 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 2).map((tag) => (
                            <Badge key={`${item.id}-sidebar-${tag}`} variant="tag" className="text-[10px] px-2 py-0">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 2 && (
                            <Badge key={`${item.id}-sidebar-more`} variant="tag" className="text-[10px] px-2 py-0">
                              +{item.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
