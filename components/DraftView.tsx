"use client";

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Draft Content</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
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
      <CardContent>
        <div className="bg-muted/50 p-4 rounded-md">
          <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
            {draftContent}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
