"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '@/lib/utils';
import { isValidLinkProtocol } from '@/lib/sanitize';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        "prose-headings:font-semibold prose-headings:text-foreground prose-headings:tracking-tight",
        "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
        "prose-p:text-sm prose-p:leading-relaxed prose-p:text-foreground/90",
        "prose-li:text-sm prose-li:leading-relaxed prose-li:text-foreground/90",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-code:text-xs prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:text-xs prose-pre:leading-relaxed",
        "prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:italic",
        "prose-hr:border-border",
        "prose-table:text-sm",
        "prose-th:bg-muted prose-th:font-semibold prose-th:text-foreground",
        "prose-td:border-border",
        "prose-img:rounded-lg prose-img:shadow-sm",
        "prose-ul:list-disc prose-ol:list-decimal",
        "prose-li:marker:text-primary/70",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ node, ...props }) => {
            // Validate link protocol to prevent XSS via javascript: or data: URLs
            const href = props.href;
            if (!isValidLinkProtocol(href)) {
              // Render as plain text if protocol is unsafe
              return <span className="text-muted-foreground">{props.children}</span>;
            }
            return <a {...props} target="_blank" rel="noopener noreferrer" />;
          },
          code: ({ node, inline, ...props }) => {
            if (inline) {
              return <code {...props} />;
            }
            return (
              <code className="block" {...props} />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
