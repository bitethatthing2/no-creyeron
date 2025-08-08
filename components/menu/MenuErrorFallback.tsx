// components/menu/MenuErrorFallback.tsx
"use client";

interface MenuErrorFallbackProps {
  errorMessage: string;
}

export function MenuErrorFallback({ errorMessage }: MenuErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full p-6 border rounded-lg shadow-lg bg-card text-card-foreground">
        <h1 className="text-2xl font-bold text-destructive mb-4">Menu Unavailable</h1>
        <p className="text-muted-foreground mb-4">
          We&apos;re sorry, but we couldn&apos;t load the menu categories right now.
          This might be a temporary issue. Please try refreshing the page.
        </p>
        <details className="mt-4 text-left text-sm text-muted-foreground">
          <summary className="cursor-pointer font-medium text-primary hover:underline">
            Show Technical Details
          </summary>
          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto whitespace-pre-wrap">
            {errorMessage}
          </pre>
        </details>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}