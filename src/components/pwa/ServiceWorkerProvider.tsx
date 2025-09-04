'use client';

import { useEffect, createContext, useContext } from 'react';

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
  useEffect(() => {
    // PWA functionality has been removed from HERA
    // Clean up any existing service workers
    if ('serviceWorker' in navigator) {
      cleanupServiceWorkers();
    }
  }, []);

  const cleanupServiceWorkers = async () => {
    try {
      // First, register the kill switch service worker
      const killSwitch = await navigator.serviceWorker.register('/sw-killswitch.js', {
        scope: '/',
      });
      
      console.log('[PWA Removal] Kill switch service worker registered');
      
      // After a delay, unregister all service workers
      setTimeout(async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          const success = await registration.unregister();
          console.log('[PWA Removal] Service worker unregistered:', success);
        }
      }, 2000);
    } catch (error) {
      console.error('[PWA Removal] Error during cleanup:', error);
    }
  };

  // Provide dummy context values since PWA is removed
  return (
    <ServiceWorkerContext.Provider
      value={{
        isUpdateAvailable: false,
        updateServiceWorker: () => {},
        registration: null,
      }}
    >
      {children}
    </ServiceWorkerContext.Provider>
  );
}