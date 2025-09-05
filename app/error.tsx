'use client';

export const dynamic = 'force-dynamic';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center max-w-md mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="mb-4 text-gray-300">An error occurred while processing your request.</p>
        <div className="space-y-2 mb-6">
          <button
            onClick={reset}
            className="w-full bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors"
          >
            Try again
          </button>
          <a 
            href="/"
            className="block w-full bg-transparent border border-white text-white px-4 py-2 rounded hover:bg-white hover:text-black transition-colors"
          >
            Return Home
          </a>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left text-xs text-gray-400">
            <summary className="cursor-pointer">Error Details</summary>
            <pre className="mt-2 overflow-auto">{error.message}</pre>
          </details>
        )}
      </div>
    </div>
  );
}