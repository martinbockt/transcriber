"use client";

import { forwardRef } from "react";
import Image from "next/image";
import {
  Mic,
  ListTodo,
  FileQuestion,
  FileEdit,
  StickyNote,
  Download,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SearchBar, type DateRange } from "@/components/SearchBar";
import type { VoiceItem, IntentType } from "@/types/voice-item";
import { cn } from "@/lib/utils";

interface SidebarProps {
  items: VoiceItem[];
  activeItemId: string | null;
  onSelectItem: (id: string) => void;
  onNewRecording: () => void;
  onExportAll: () => void;
  isRecording: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedIntents: IntentType[];
  onIntentsChange: (intents: IntentType[]) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onOpenSettings?: () => void;
}

const intentIcons: Record<IntentType, typeof ListTodo> = {
  TODO: ListTodo,
  RESEARCH: FileQuestion,
  DRAFT: FileEdit,
  NOTE: StickyNote,
};

const intentColors: Record<IntentType, string> = {
  TODO: "text-[hsl(var(--intent-todo))]",
  RESEARCH: "text-[hsl(var(--intent-research))]",
  DRAFT: "text-[hsl(var(--intent-draft))]",
  NOTE: "text-[hsl(var(--intent-note))]",
};

const intentBorderColors: Record<IntentType, string> = {
  TODO: "border-l-[hsl(var(--intent-todo))]",
  RESEARCH: "border-l-[hsl(var(--intent-research))]",
  DRAFT: "border-l-[hsl(var(--intent-draft))]",
  NOTE: "border-l-[hsl(var(--intent-note))]",
};

// Helper function to highlight search terms in text
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) {
    return text;
  }

  const parts = text.split(
    new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
  );

  return parts.map((part, index) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

export const Sidebar = forwardRef<HTMLInputElement, SidebarProps>(
  function Sidebar(
    {
      items,
      activeItemId,
      onSelectItem,
      onNewRecording,
      onExportAll,
      isRecording,
      searchQuery,
      onSearchChange,
      selectedIntents,
      onIntentsChange,
      dateRange,
      onDateRangeChange,
      onOpenSettings,
    },
    ref,
  ) {
    // Determine if we're in a search/filter context
    const hasActiveFilters =
      searchQuery.trim() !== "" ||
      selectedIntents.length > 0 ||
      dateRange !== "all";

    // Calculate total items (would need to be passed from parent in real scenario)
    // For now, we show count when filters are active
    const showResultCount = hasActiveFilters && items.length > 0;
    return (
      <div className="w-80 border-r bg-muted/10 flex flex-col h-screen">
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="Voice Assistant Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <h1 className="text-2xl font-bold">Voice Assistant</h1>
            </div>
            {onOpenSettings && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSettings}
                className="h-8 w-8"
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}
          </div>
          <Button
            onClick={onNewRecording}
            size="lg"
            className="w-full"
            variant={isRecording ? "destructive" : "default"}
          >
            <Mic
              className={cn("mr-2 h-5 w-5", isRecording && "animate-pulse")}
            />
            {isRecording ? "Recording..." : "New Recording"}
          </Button>
          <Button
            onClick={onExportAll}
            disabled={items.length === 0}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <Download className="mr-2 h-5 w-5" />
            Export All
          </Button>
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
            <p className="text-xs text-muted-foreground mt-2">
              {items.length} {items.length === 1 ? "result" : "results"} found
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
                    <p className="text-xs mt-1">
                      Try adjusting your search or filters
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm">No recordings yet</p>
                    <p className="text-xs mt-1">
                      Click the button above to start
                    </p>
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
                      "p-3 cursor-pointer transition-all duration-200 hover:bg-accent border-l-2",
                      intentBorderColors[item.intent],
                      isActive && "bg-accent shadow-xs",
                    )}
                    onClick={() => onSelectItem(item.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={cn(
                          "h-5 w-5 mt-0.5",
                          intentColors[item.intent],
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-2 mb-1">
                          {highlightText(item.title, searchQuery)}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(item.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                        {item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={`${item.id}-sidebar-${tag}`}
                                variant="tag"
                                className={cn(
                                  "text-[10px] px-2 py-0",
                                  isActive &&
                                    "bg-white/20 text-white hover:bg-white/30",
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
                                  "text-[10px] px-2 py-0",
                                  isActive &&
                                    "bg-white/20 text-white hover:bg-white/30",
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
  },
);
