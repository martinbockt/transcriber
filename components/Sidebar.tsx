"use client";

import { Mic, ListTodo, FileQuestion, FileEdit, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SearchBar, type DateRange } from '@/components/SearchBar';
import type { VoiceItem, IntentType } from '@/types/voice-item';
import { cn } from '@/lib/utils';

interface SidebarProps {
  items: VoiceItem[];
  activeItemId: string | null;
  onSelectItem: (id: string) => void;
  onNewRecording: () => void;
  isRecording: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedIntents: IntentType[];
  onIntentsChange: (intents: IntentType[]) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

const intentIcons: Record<IntentType, typeof ListTodo> = {
  TODO: ListTodo,
  RESEARCH: FileQuestion,
  DRAFT: FileEdit,
  NOTE: StickyNote,
};

const intentColors: Record<IntentType, string> = {
  TODO: 'text-blue-600',
  RESEARCH: 'text-purple-600',
  DRAFT: 'text-green-600',
  NOTE: 'text-gray-600',
};

// Helper function to highlight search terms in text
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) {
    return text;
  }

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return parts.map((part, index) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {part}
        </mark>
      );
    }
    return part;
  });
}

export function Sidebar({
  items,
  activeItemId,
  onSelectItem,
  onNewRecording,
  isRecording,
  searchQuery,
  onSearchChange,
  selectedIntents,
  onIntentsChange,
  dateRange,
  onDateRangeChange,
}: SidebarProps) {
  // Determine if we're in a search/filter context
  const hasActiveFilters = searchQuery.trim() !== '' || selectedIntents.length > 0 ||
    dateRange.from !== undefined || dateRange.to !== undefined;

  // Calculate total items (would need to be passed from parent in real scenario)
  // For now, we show count when filters are active
  const showResultCount = hasActiveFilters && items.length > 0;

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

      <div className="p-4">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedIntents={selectedIntents}
          onIntentsChange={onIntentsChange}
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />
        {showResultCount && (
          <p className="text-xs text-muted-foreground mt-2">
            {items.length} {items.length === 1 ? 'result' : 'results'} found
          </p>
        )}
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {hasActiveFilters ? (
                <>
                  <p className="text-sm">No matching results</p>
                  <p className="text-xs mt-1">Try adjusting your search or filters</p>
                </>
              ) : (
                <>
                  <p className="text-sm">No recordings yet</p>
                  <p className="text-xs mt-1">Click the button above to start</p>
                </>
              )}
            </div>
          ) : (
            items.map((item) => {
              const Icon = intentIcons[item.intent];
              const isActive = item.id === activeItemId;

              return (
                <Card
                  key={item.id}
                  className={cn(
                    "p-3 cursor-pointer transition-colors hover:bg-accent",
                    isActive && "bg-accent border-primary"
                  )}
                  onClick={() => onSelectItem(item.id)}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={cn("h-5 w-5 mt-0.5", intentColors[item.intent])} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-2 mb-1">
                        {highlightText(item.title, searchQuery)}
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
                          {item.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
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
