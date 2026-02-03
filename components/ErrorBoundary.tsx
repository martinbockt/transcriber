'use client';

import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo;
  resetError: () => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call optional reset callback
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo!}
            resetError={this.resetError}
          />
        );
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo!}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, errorInfo, resetError }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-destructive/10 text-destructive flex h-12 w-12 items-center justify-center rounded-full">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
              <CardDescription className="mt-1">
                An unexpected error occurred. Please try reloading the application.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-md p-4">
            <p className="text-sm font-medium">Error Message:</p>
            <p className="text-muted-foreground mt-1 break-words text-sm font-mono">
              {error.message || 'Unknown error'}
            </p>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full"
            >
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </Button>
          )}
          {showDetails && errorInfo && (
            <div className="bg-muted max-h-64 overflow-auto rounded-md p-4">
              <p className="text-xs font-medium">Stack Trace:</p>
              <pre className="text-muted-foreground mt-2 whitespace-pre-wrap break-words text-xs font-mono">
                {error.stack}
              </pre>
              {errorInfo.componentStack && (
                <>
                  <p className="mt-4 text-xs font-medium">Component Stack:</p>
                  <pre className="text-muted-foreground mt-2 whitespace-pre-wrap break-words text-xs font-mono">
                    {errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
          <Button onClick={resetError} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export function ErrorDialog({
  open,
  error,
  onClose,
  onRetry,
}: {
  open: boolean;
  error: Error;
  onClose: () => void;
  onRetry?: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-5 w-5" />
            <AlertDialogTitle>Error</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {error.message || 'An unexpected error occurred'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onRetry && (
            <Button onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { ErrorBoundary };
