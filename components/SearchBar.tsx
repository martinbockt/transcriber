"use client";

import { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IntentType } from "@/types/voice-item";
import { cn } from "@/lib/utils";

export type DateRange = "all" | "today" | "week" | "month";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedIntents: IntentType[];
  onIntentsChange: (intents: IntentType[]) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

const intentTypes: IntentType[] = ["TODO", "RESEARCH", "DRAFT", "NOTE"];

const intentColors: Record<IntentType, string> = {
  TODO: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300",
  RESEARCH:
    "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-300",
  DRAFT: "bg-green-100 text-green-700 hover:bg-green-200 border-green-300",
  NOTE: "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300",
};

const dateRangeLabels: Record<DateRange, string> = {
  all: "All Time",
  today: "Today",
  week: "This Week",
  month: "This Month",
};

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar(
    {
      searchQuery,
      onSearchChange,
      selectedIntents,
      onIntentsChange,
      dateRange,
      onDateRangeChange,
    },
    ref,
  ) {
    const toggleIntent = (intent: IntentType) => {
      if (selectedIntents.includes(intent)) {
        onIntentsChange(selectedIntents.filter((i) => i !== intent));
      } else {
        onIntentsChange([...selectedIntents, intent]);
      }
    };

    const clearSearch = () => {
      onSearchChange("");
      onIntentsChange([]);
      onDateRangeChange("all");
    };

    const hasActiveFilters =
      searchQuery || selectedIntents.length > 0 || dateRange !== "all";

    return (
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={ref}
            type="text"
            placeholder="Search voice items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Intent Type Filters */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground px-1">
            Filter by type:
          </div>
          <div className="flex flex-wrap gap-2">
            {intentTypes.map((intent) => {
              const isSelected = selectedIntents.includes(intent);
              return (
                <Badge
                  key={intent}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all",
                    isSelected && intentColors[intent],
                  )}
                  onClick={() => toggleIntent(intent)}
                >
                  {intent}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground px-1">
            Filter by date:
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "today", "week", "month"] as DateRange[]).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => onDateRangeChange(range)}
                className="text-xs"
              >
                {dateRangeLabels[range]}
              </Button>
            ))}
          </div>
        </div>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="w-full text-xs text-muted-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Clear all filters
          </Button>
        )}
      </div>
    );
  },
);
