'use client';

import { useEffect, useState, createContext, useContext } from 'react';

interface ServiceWorkerContextType {
  isUpdateAvailable: boolean;
  updateServiceWorker: () => void;
  registration: ServiceWorkerRegistration | null;
}

const ServiceWorkerContext = createContext<ServiceWorkerContextType>({
  isUpdateAvailable: false,
  updateServiceWorker: () => {},
  registration: null,
});

export const useServiceWorker = () => useContext(ServiceWorkerContext);

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      setRegistration(reg);
      console.log('[SW] Service Worker registered successfully');

      // Check for updates immediately on load
      reg.update();
      
      // Check for updates every 30 seconds in production
      // This ensures users get updates quickly
      const updateInterval = setInterval(() => {
        reg.update().catch(err => {
          console.error('[SW] Update check failed:', err);
        });
      }, 30 * 1000);
      
      // Check on visibility change (when user returns to tab)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          reg.update();
        }
      });
      
      // Check on focus (when user returns to window)
      window.addEventListener('focus', () => {
        reg.update();
      });
      
      // Cleanup interval on unmount
      return () => clearInterval(updateInterval);

      // Handle updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is ready
              setWaitingWorker(newWorker);
              setIsUpdateAvailable(true);
              console.log('[SW] New version available');
            }
          });
        }
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      // Get version from service worker
      if (navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          if (event.data && event.data.version) {
            console.log(`[SW] Current version: ${event.data.version}`);
          }
        };
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_VERSION' },
          [messageChannel.port2]
        );
      }
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
    }
  };

  const updateServiceWorker = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setIsUpdateAvailable(false);
    }
  };

  return (
    <ServiceWorkerContext.Provider
      value={{
        isUpdateAvailable,
        updateServiceWorker,
        registration,
      }}
    >
      {children}
      
      {/* Update notification */}
      {isUpdateAvailable && (
        <div className="fixed bottom-4 right-4 max-w-sm bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-4 z-50">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-cyan-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-white">
                Update Available
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                A new version of HERA is available. Refresh to update.
              </p>
              <div className="mt-3 flex space-x-3">
                <button
                  onClick={updateServiceWorker}
                  className="px-3 py-1 text-sm font-medium bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
                >
                  Update Now
                </button>
                <button
                  onClick={() => setIsUpdateAvailable(false)}
                  className="text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ServiceWorkerContext.Provider>
  );
}