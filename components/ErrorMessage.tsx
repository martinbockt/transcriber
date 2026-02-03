'use client';

import * as React from 'react';
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ErrorMessageProps {
  /**
   * User-friendly error title
   */
  title: string;

  /**
   * User-friendly error message explaining what went wrong
   */
  message: string;

  /**
   * Optional retry callback function
   */
  onRetry?: () => void;

  /**
   * Optional technical details or stack trace for debugging
   */
  details?: string;

  /**
   * Error severity level
   * @default 'error'
   */
  variant?: 'error' | 'warning';

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const ErrorMessage = React.forwardRef<HTMLDivElement, ErrorMessageProps>(
  ({ title, message, onRetry, details, variant = 'error', className }, ref) => {
    const [showDetails, setShowDetails] = React.useState(false);

    const variantStyles = {
      error: {
        border: 'border-l-destructive',
        icon: 'text-destructive',
        badge: 'destructive' as const,
      },
      warning: {
        border: 'border-l-yellow-500',
        icon: 'text-yellow-500',
        badge: 'outline' as const,
      },
    };

    const styles = variantStyles[variant];

    return (
      <Card
        ref={ref}
        className={cn(
          'border-l-4',
          styles.border,
          'transition-all duration-200',
          className,
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <AlertCircle className={cn('mt-0.5 h-5 w-5 flex-shrink-0', styles.icon)} />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{title}</CardTitle>
                <Badge variant={styles.badge} className="text-xs">
                  {variant === 'error' ? 'Error' : 'Warning'}
                </Badge>
              </div>
              <CardDescription className="text-sm leading-relaxed">
                {message}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Retry Button */}
          {onRetry && (
            <div className="flex gap-2">
              <Button
                onClick={onRetry}
                variant="default"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          )}

          {/* Collapsible Details Section */}
          {details && (
            <div className="space-y-2">
              <Button
                onClick={() => setShowDetails(!showDetails)}
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Show Details
                  </>
                )}
              </Button>

              {showDetails && (
                <div className="rounded-md bg-muted p-3">
                  <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words font-mono">
                    {details}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);

ErrorMessage.displayName = 'ErrorMessage';
