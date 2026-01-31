"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Research Answer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {answer}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
