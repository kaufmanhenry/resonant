'use client';

import { useEffect, useState } from 'react';
import { usePWA } from '@/hooks/usePWA';

export function UpdateNotification() {
  const { updateAvailable, applyUpdate } = usePWA();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      setShow(true);
    }
  }, [updateAvailable]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Update Available
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              A new version is ready. Reload to update.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  applyUpdate();
                }}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={() => setShow(false)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-border hover:bg-accent transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
