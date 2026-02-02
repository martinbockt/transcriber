"use client";

import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { VoiceItem } from '@/types/voice-item';

interface TodoViewProps {
  item: VoiceItem;
  onToggleTodo?: (todoIndex: number) => void;
}

export function TodoView({ item, onToggleTodo }: TodoViewProps) {
  const todos = item.data.todos || [];

  if (todos.length === 0) {
    return null;
  }

  const completedCount = todos.filter(t => t.done).length;
  const totalCount = todos.length;

  return (
    <Card className="border-l-4 border-l-[hsl(var(--intent-todo))]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold tracking-tight">Action Items</CardTitle>
          <Badge variant="todo" className="text-xs">
            {completedCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {todos.map((todo, index) => (
            <div
              key={`${item.id}-todo-${index}`}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${
                todo.done
                  ? 'bg-muted/30 border-border'
                  : 'bg-[hsl(var(--intent-todo))]/5 border-[hsl(var(--intent-todo))]/20 hover:border-[hsl(var(--intent-todo))]/40'
              }`}
            >
              <Checkbox
                id={`todo-${index}`}
                checked={todo.done}
                onCheckedChange={() => onToggleTodo?.(index)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={`todo-${index}`}
                  className={`cursor-pointer text-sm leading-relaxed block ${
                    todo.done ? 'line-through text-muted-foreground' : 'text-foreground'
                  }`}
                >
                  {todo.task}
                </label>
                {todo.due && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(todo.due).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
