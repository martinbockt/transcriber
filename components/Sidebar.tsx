'use client';

import { forwardRef, useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Mic,
  ListTodo,
  FileQuestion,
  FileEdit,
  StickyNote,
  Download,
  Settings,
  Pin,
  WifiOff,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SearchBar, type DateRange } from '@/components/SearchBar';
import type { VoiceItem, IntentType } from '@/types/voice-item';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/language-provider';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getFailedRecordingsCount } from '@/lib/failed-recordings';

interface SidebarProps {
  items: VoiceItem[];
  activeItemId: string | null;
  onSelectItem: (id: string) => void;
  onNewRecording: () => void;
  onExportAll: () => void;
  isRecording: boolean;
  countdown: number | null;
  elapsedTime: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedIntents: IntentType[];
  onIntentsChange: (intents: IntentType[]) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onOpenSettings?: () => void;
  onTogglePin: (itemId: string) => void;
  onRetryAllFailed?: () => void;
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

// Helper function to highlight search terms in text
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) {
    return text;
  }

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return parts.map((part, index) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark key={index} className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-800">
          {part}
        </mark>
      );
    }
    return part;
  });
}

export const Sidebar = forwardRef<HTMLInputElement, SidebarProps>(function Sidebar(
  {
    items,
    activeItemId,
    onSelectItem,
    onNewRecording,
    onExportAll,
    isRecording,
    countdown,
    elapsedTime,
    searchQuery,
    onSearchChange,
    selectedIntents,
    onIntentsChange,
    dateRange,
    onDateRangeChange,
    onOpenSettings,
    onTogglePin,
    onRetryAllFailed,
  },
  ref,
) {
  // Determine if we're in a search/filter context
  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedIntents.length > 0 || dateRange !== 'all';

  // Calculate total items (would need to be passed from parent in real scenario)
  // For now, we show count when filters are active
  const showResultCount = hasActiveFilters && items.length > 0;
  const { dictionary, locale } = useTranslation();
  const { isOnline } = useNetworkStatus();

  // Track failed recordings count
  const [failedRecordingsCount, setFailedRecordingsCount] = useState(0);

  // Load failed recordings count on mount and when items change
  useEffect(() => {
    async function loadFailedCount() {
      const count = await getFailedRecordingsCount();
      setFailedRecordingsCount(count);
    }
    loadFailedCount();
  }, [items.length]); // Refresh when items are added (successful retry)

  return (
    <div className="bg-muted/10 flex h-screen w-80 flex-col border-r">
      <div className="space-y-2 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Voice Assistant Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <h1 className="text-2xl font-bold">Voice Assistant</h1>
          </div>
          {onOpenSettings && (
            <Button variant="ghost" size="icon" onClick={onOpenSettings} className="h-8 w-8">
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </div>
        <Button
          onClick={onNewRecording}
          size="lg"
          className="w-full"
          variant={isRecording ? 'destructive' : 'default'}
        >
          <Mic
            className={cn('mr-2 h-5 w-5', (isRecording || countdown !== null) && 'animate-pulse')}
          />
          {countdown !== null
            ? `${dictionary.status.starting} ${countdown}...`
            : isRecording
              ? `${dictionary.status.recording}: ${Math.floor(elapsedTime / 60)}:${(elapsedTime % 60).toString().padStart(2, '0')}`
              : dictionary.navigation.newRecording}
        </Button>
        <Button
          onClick={onExportAll}
          disabled={items.length === 0}
          variant="outline"
          size="lg"
          className="w-full"
        >
          <Download className="mr-2 h-5 w-5" />
          {dictionary.navigation.exportAll}
        </Button>
        {!isOnline && (
          <div className="mt-2 flex items-center gap-2 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
            <WifiOff className="h-4 w-4 flex-shrink-0" />
            <span>Offline - Some features may be unavailable</span>
          </div>
        )}
        {failedRecordingsCount > 0 && onRetryAllFailed && (
          <div className="mt-2 flex items-center gap-2 rounded-md bg-red-100 px-3 py-2 text-sm text-red-900 dark:bg-red-950/50 dark:text-red-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <div className="flex flex-1 items-center justify-between gap-2">
              <span>
                {failedRecordingsCount} failed recording{failedRecordingsCount > 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs hover:bg-red-200 dark:hover:bg-red-900"
                onClick={onRetryAllFailed}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Retry All
              </Button>
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="p-4">
        <SearchBar
          ref={ref}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedIntents={selectedIntents}
          onIntentsChange={onIntentsChange}
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />
        {showResultCount && (
          <p className="text-muted-foreground mt-2 text-xs">
            {items.length}{' '}
            {items.length === 1 ? dictionary.navigation.result : dictionary.navigation.results}
          </p>
        )}
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="space-y-3 p-4">
          {items.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              {hasActiveFilters ? (
                <>
                  <p className="text-sm">{dictionary.navigation.noResults}</p>
                  <p className="mt-1 text-xs">{dictionary.navigation.tryAdjusting}</p>
                </>
              ) : (
                <>
                  <p className="text-sm">{dictionary.navigation.noRecordings}</p>
                  <p className="mt-1 text-xs">{dictionary.navigation.startPrompt}</p>
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
                    'hover:bg-accent relative cursor-pointer border-l-2 p-3 transition-all duration-200',
                    intentBorderColors[item.intent],
                    isActive && 'bg-accent text-accent-foreground shadow-xs',
                    item.pinned && 'bg-amber-50/30 ring-1 ring-amber-400/30 dark:bg-amber-950/20',
                  )}
                  onClick={() => onSelectItem(item.id)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'absolute top-2 right-2 h-6 w-6 transition-all duration-200',
                      item.pinned
                        ? 'text-amber-500 opacity-100 hover:text-amber-600'
                        : 'opacity-60 hover:opacity-100',
                      isActive &&
                        !item.pinned &&
                        'text-accent-foreground/70 hover:text-accent-foreground',
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(item.id);
                    }}
                  >
                    <Pin className={cn('h-4 w-4', item.pinned && 'fill-current')} />
                  </Button>
                  <div className="flex items-start gap-3">
                    <Icon
                      className={cn(
                        'mt-0.5 h-5 w-5',
                        isActive ? 'text-accent-foreground' : intentColors[item.intent],
                      )}
                    />
                    <div className="min-w-0 flex-1 pr-6">
                      <h3 className="mb-1 line-clamp-2 text-sm font-medium">
                        {highlightText(item.title, searchQuery)}
                      </h3>
                      <p
                        className={cn(
                          'mb-2 text-xs',
                          isActive ? 'text-accent-foreground/80' : 'text-muted-foreground',
                        )}
                      >
                        {new Date(item.createdAt).toLocaleDateString(locale, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={`${item.id}-sidebar-${tag}`}
                              variant="tag"
                              className={cn(
                                'px-2 py-0 text-[10px]',
                                isActive && 'bg-white/20 text-white hover:bg-white/30',
                              )}
                            >
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 2 && (
                            <Badge
                              key={`${item.id}-sidebar-more`}
                              variant="tag"
                              className={cn(
                                'px-2 py-0 text-[10px]',
                                isActive && 'bg-white/20 text-white hover:bg-white/30',
                              )}
                            >
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
});
