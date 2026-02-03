'use client';

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

  const completedCount = todos.filter((t) => t.done).length;
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
              className={`flex items-start gap-3 rounded-lg border p-3 transition-all duration-200 ${
                todo.done
                  ? 'bg-muted/30 border-border'
                  : 'border-[hsl(var(--intent-todo))]/20 bg-[hsl(var(--intent-todo))]/5 hover:border-[hsl(var(--intent-todo))]/40'
              }`}
            >
              <Checkbox
                id={`todo-${index}`}
                checked={todo.done}
                onCheckedChange={() => onToggleTodo?.(index)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <label
                  htmlFor={`todo-${index}`}
                  className={`block cursor-pointer text-sm leading-relaxed ${
                    todo.done ? 'text-muted-foreground line-through' : 'text-foreground'
                  }`}
                >
                  {todo.task}
                </label>
                {todo.due && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <Calendar className="text-muted-foreground h-3 w-3" />
                    <span className="text-muted-foreground text-xs">
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
