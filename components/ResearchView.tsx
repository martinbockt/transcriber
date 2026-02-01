"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { VoiceItem } from '@/types/voice-item';

interface ResearchViewProps {
  item: VoiceItem;
}

export function ResearchView({ item }: ResearchViewProps) {
  const answer = item.data.researchAnswer;

  if (!answer) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-[hsl(var(--intent-research))]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold tracking-tight">Research Answer</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <MarkdownRenderer content={answer} />
      </CardContent>
    </Card>
  );
}
