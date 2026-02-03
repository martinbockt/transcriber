'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { VoiceItem } from '@/types/voice-item';

interface DraftViewProps {
  item: VoiceItem;
}

export function DraftView({ item }: DraftViewProps) {
  const [copied, setCopied] = useState(false);
  const draftContent = item.data.draftContent;

  if (!draftContent) {
    return null;
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(draftContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-l-4 border-l-[hsl(var(--intent-draft))]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg font-semibold tracking-tight">Draft Content</CardTitle>
          <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0 gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-lg border border-[hsl(var(--intent-draft))]/20 bg-[hsl(var(--intent-draft))]/5 p-4">
          <MarkdownRenderer content={draftContent} />
        </div>
      </CardContent>
    </Card>
  );
}
