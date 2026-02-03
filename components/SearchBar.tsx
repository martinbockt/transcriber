'use client';

import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { IntentType } from '@/types/voice-item';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/language-provider';

export type DateRange = 'all' | 'today' | 'week' | 'month';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedIntents: IntentType[];
  onIntentsChange: (intents: IntentType[]) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

const intentTypes: IntentType[] = ['TODO', 'RESEARCH', 'DRAFT', 'NOTE'];

const intentColors: Record<IntentType, string> = {
  TODO: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300',
  RESEARCH: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-300',
  DRAFT: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300',
  NOTE: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300',
};

// Date labels will be handled by the component using the dictionary
// const dateRangeLabels: Record<DateRange, string> = {
//   all: 'All Time',
//   today: 'Today',
//   week: 'This Week',
//   month: 'This Month',
// };

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
  { searchQuery, onSearchChange, selectedIntents, onIntentsChange, dateRange, onDateRangeChange },
  ref,
) {
  const { dictionary } = useTranslation();

  const toggleIntent = (intent: IntentType) => {
    if (selectedIntents.includes(intent)) {
      onIntentsChange(selectedIntents.filter((i) => i !== intent));
    } else {
      onIntentsChange([...selectedIntents, intent]);
    }
  };

  const clearSearch = () => {
    onSearchChange('');
    onIntentsChange([]);
    onDateRangeChange('all');
  };

  const hasActiveFilters = searchQuery || selectedIntents.length > 0 || dateRange !== 'all';

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          ref={ref}
          type="text"
          placeholder={dictionary.searchBar.placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pr-9 pl-9"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Intent Type Filters */}
      <div className="space-y-2">
        <div className="text-muted-foreground px-1 text-xs font-medium">
          {dictionary.searchBar.filterByType}
        </div>
        <div className="flex flex-wrap gap-2">
          {intentTypes.map((intent) => {
            const isSelected = selectedIntents.includes(intent);
            return (
              <Badge
                key={intent}
                variant="outline"
                className={cn('cursor-pointer transition-all', isSelected && intentColors[intent])}
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
        <div className="text-muted-foreground px-1 text-xs font-medium">
          {dictionary.searchBar.filterByDate}
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'today', 'week', 'month'] as DateRange[]).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => onDateRangeChange(range)}
              className="text-xs"
            >
              {dictionary.searchBar.dateRanges[range]}
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
          className="text-muted-foreground w-full text-xs"
        >
          <X className="mr-1 h-3 w-3" />
          {dictionary.searchBar.clearFilters}
        </Button>
      )}
    </div>
  );
});
