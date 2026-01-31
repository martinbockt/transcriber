"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Action Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {todos.map((todo, index) => (
            <div key={index} className="flex items-start gap-3 group">
              <Checkbox
                id={`todo-${index}`}
                checked={todo.done}
                onCheckedChange={() => onToggleTodo?.(index)}
                className="mt-1"
              />
              <div className="flex-1">
                <label
                  htmlFor={`todo-${index}`}
                  className={`cursor-pointer text-sm ${
                    todo.done ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {todo.task}
                </label>
                {todo.due && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Due: {new Date(todo.due).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
